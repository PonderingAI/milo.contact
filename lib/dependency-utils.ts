/**
 * Dependency Utilities
 *
 * This file contains utilities for fetching, checking, and managing dependencies.
 */

import { exec } from "child_process"
import { promisify } from "util"
import fs from "fs"
import path from "path"
import { createAdminClient } from "./supabase-server"

const execAsync = promisify(exec)

// Types
export interface DependencyInfo {
  name: string
  current_version: string
  latest_version?: string
  description?: string
  is_dev?: boolean
  outdated?: boolean
  has_security_update?: boolean
  update_mode?: "manual" | "auto" | "conservative" | "global"
  locked?: boolean
  locked_version?: string
}

export interface AuditResult {
  vulnerabilities: Record<string, any>
  metadata: Record<string, any>
  securityScore: number
  vulnerableCount: number
}

/**
 * Get dependencies from package.json
 */
export async function getDependenciesFromPackageJson(): Promise<{
  dependencies: DependencyInfo[]
  devDependencies: DependencyInfo[]
}> {
  try {
    // Read package.json directly from the file system
    const packageJsonPath = path.join(process.cwd(), "package.json")
    const packageJsonContent = fs.readFileSync(packageJsonPath, "utf8")
    const packageJson = JSON.parse(packageJsonContent)

    return {
      dependencies: Object.entries(packageJson.dependencies || {}).map(([name, version]) => ({
        name,
        current_version: version.toString().replace(/^\^|~/, ""),
        is_dev: false,
      })),
      devDependencies: Object.entries(packageJson.devDependencies || {}).map(([name, version]) => ({
        name,
        current_version: version.toString().replace(/^\^|~/, ""),
        is_dev: true,
      })),
    }
  } catch (error) {
    console.error("Error reading package.json:", error)

    // Fallback to hardcoded dependencies if we can't read package.json
    return {
      dependencies: [
        { name: "next", current_version: "14.0.3", is_dev: false },
        { name: "react", current_version: "18.2.0", is_dev: false },
        { name: "react-dom", current_version: "18.2.0", is_dev: false },
        { name: "@supabase/supabase-js", current_version: "2.38.4", is_dev: false },
        { name: "nodemailer", current_version: "6.9.9", is_dev: false },
        { name: "tailwindcss", current_version: "3.3.0", is_dev: false },
      ],
      devDependencies: [
        { name: "typescript", current_version: "5.0.4", is_dev: true },
        { name: "eslint", current_version: "8.38.0", is_dev: true },
        { name: "@types/react", current_version: "18.0.28", is_dev: true },
        { name: "@types/node", current_version: "18.15.11", is_dev: true },
      ],
    }
  }
}

/**
 * Get package descriptions from npm registry
 */
export async function getPackageDescriptions(packageNames: string[]): Promise<Record<string, string>> {
  const descriptions: Record<string, string> = {}
  const batchSize = 10
  const batches = []

  // Split package names into batches to avoid too many concurrent requests
  for (let i = 0; i < packageNames.length; i += batchSize) {
    batches.push(packageNames.slice(i, i + batchSize))
  }

  // Process each batch sequentially
  for (const batch of batches) {
    await Promise.all(
      batch.map(async (name) => {
        try {
          const response = await fetch(`https://registry.npmjs.org/${name}`)
          if (response.ok) {
            const data = await response.json()
            descriptions[name] = data.description || "No description available"
          }
        } catch (error) {
          console.error(`Error fetching description for ${name}:`, error)
          descriptions[name] = "Description unavailable"
        }
      }),
    )
  }

  return descriptions
}

/**
 * Get outdated packages using npm outdated
 */
export async function getOutdatedPackages(): Promise<Record<string, any>> {
  try {
    const { stdout } = await execAsync("npm outdated --json", { timeout: 30000 })
    return JSON.parse(stdout || "{}")
  } catch (error) {
    // npm outdated returns exit code 1 if there are outdated packages
    if (error instanceof Error && "stdout" in error) {
      try {
        return JSON.parse((error as any).stdout || "{}")
      } catch (parseError) {
        console.error("Error parsing npm outdated output:", parseError)
        return {}
      }
    }
    console.error("Error running npm outdated:", error)
    return {}
  }
}

/**
 * Get security vulnerabilities using npm audit
 */
export async function getSecurityVulnerabilities(): Promise<Record<string, any>> {
  try {
    const { stdout } = await execAsync("npm audit --json", { timeout: 30000 })
    return JSON.parse(stdout || "{}")
  } catch (error) {
    // npm audit returns exit code 1 if there are vulnerabilities
    if (error instanceof Error && "stdout" in error) {
      try {
        return JSON.parse((error as any).stdout || "{}")
      } catch (parseError) {
        console.error("Error parsing npm audit output:", parseError)
        return {}
      }
    }
    console.error("Error running npm audit:", error)
    return {}
  }
}

/**
 * Calculate security score based on vulnerabilities and outdated packages
 */
export function calculateSecurityScore(deps: DependencyInfo[]): number {
  const totalDeps = deps.length
  if (totalDeps === 0) return 100

  const vulnerableDeps = deps.filter((d) => d.has_security_update).length
  const outdatedDeps = deps.filter((d) => d.outdated).length

  // Calculate score: start with 100 and deduct points
  let score = 100

  // Deduct more for vulnerable dependencies
  score -= (vulnerableDeps / totalDeps) * 50

  // Deduct less for outdated dependencies
  score -= (outdatedDeps / totalDeps) * 20

  // Ensure score is between 0 and 100
  return Math.max(0, Math.min(100, Math.round(score)))
}

/**
 * Sync dependencies with database
 */
export async function syncDependenciesWithDatabase(
  dependencies: DependencyInfo[],
  outdated: Record<string, any>,
  vulnerabilities: Record<string, any>,
): Promise<void> {
  const supabase = createAdminClient()

  // Check if dependencies table exists
  const { data: tableExists, error: tableCheckError } = await supabase.rpc("check_table_exists", {
    table_name: "dependencies",
  })

  if (tableCheckError) {
    console.error("Error checking if dependencies table exists:", tableCheckError)
    return
  }

  if (!tableExists) {
    console.log("Dependencies table does not exist. Skipping database sync.")
    return
  }

  // Sync each dependency with the database
  for (const dep of dependencies) {
    const outdatedInfo = outdated[dep.name]
    const latestVersion = outdatedInfo?.latest || dep.current_version
    const isOutdated = !!outdatedInfo
    const hasSecurityIssue = vulnerabilities?.vulnerabilities?.[dep.name] !== undefined

    // Check if dependency exists in database
    const { data: existingDep, error: fetchError } = await supabase
      .from("dependencies")
      .select("id")
      .eq("name", dep.name)
      .maybeSingle()

    if (fetchError && !fetchError.message.includes("No rows found")) {
      console.error(`Error checking if dependency ${dep.name} exists:`, fetchError)
      continue
    }

    if (existingDep) {
      // Update existing dependency
      const { error: updateError } = await supabase
        .from("dependencies")
        .update({
          current_version: dep.current_version,
          latest_version: latestVersion,
          outdated: isOutdated,
          has_security_update: hasSecurityIssue,
          is_dev: dep.is_dev,
          description: dep.description,
          updated_at: new Date().toISOString(),
        })
        .eq("id", existingDep.id)

      if (updateError) {
        console.error(`Error updating dependency ${dep.name}:`, updateError)
      }
    } else {
      // Insert new dependency
      const { error: insertError } = await supabase.from("dependencies").insert({
        name: dep.name,
        current_version: dep.current_version,
        latest_version: latestVersion,
        outdated: isOutdated,
        locked: false,
        update_mode: "global",
        has_security_update: hasSecurityIssue,
        is_dev: dep.is_dev,
        description: dep.description,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })

      if (insertError) {
        console.error(`Error inserting dependency ${dep.name}:`, insertError)
      }
    }
  }
}

/**
 * Run a full dependency scan and update the database
 */
export async function runDependencyScan(): Promise<{
  dependencies: DependencyInfo[]
  vulnerabilities: number
  outdatedPackages: number
  securityScore: number
  lastScan: string
}> {
  // Get dependencies from package.json
  const { dependencies, devDependencies } = await getDependenciesFromPackageJson()
  const allDeps = [...dependencies, ...devDependencies]

  // Get package descriptions
  const packageNames = allDeps.map((dep) => dep.name)
  const descriptions = await getPackageDescriptions(packageNames)

  // Add descriptions to dependencies
  const depsWithDescriptions = allDeps.map((dep) => ({
    ...dep,
    description: descriptions[dep.name] || "No description available",
  }))

  // Get outdated packages and security vulnerabilities
  let outdated = {}
  let vulnerabilities = {}

  try {
    outdated = await getOutdatedPackages()
  } catch (error) {
    console.error("Error getting outdated packages:", error)
  }

  try {
    vulnerabilities = await getSecurityVulnerabilities()
  } catch (error) {
    console.error("Error getting security vulnerabilities:", error)
  }

  // Update dependencies with outdated and security info
  const updatedDeps = depsWithDescriptions.map((dep) => {
    const outdatedInfo = outdated[dep.name]
    const latestVersion = outdatedInfo?.latest || dep.current_version
    const isOutdated = !!outdatedInfo
    const hasSecurityIssue = vulnerabilities?.vulnerabilities?.[dep.name] !== undefined

    return {
      ...dep,
      latest_version: latestVersion,
      outdated: isOutdated,
      has_security_update: hasSecurityIssue,
    }
  })

  // Sync with database
  await syncDependenciesWithDatabase(updatedDeps, outdated, vulnerabilities)

  // Calculate security score
  const securityScore = calculateSecurityScore(updatedDeps)

  return {
    dependencies: updatedDeps,
    vulnerabilities: Object.keys(vulnerabilities?.vulnerabilities || {}).length,
    outdatedPackages: Object.keys(outdated || {}).length,
    securityScore,
    lastScan: new Date().toISOString(),
  }
}

/**
 * Update a specific dependency
 */
export async function updateDependency(
  name: string,
  version?: string,
): Promise<{
  success: boolean
  newVersion?: string
  error?: string
}> {
  try {
    // Run npm update for the specific package
    const updateCommand = version ? `npm install ${name}@${version} --save-exact` : `npm update ${name}`
    console.log(`Executing: ${updateCommand}`)

    const { stdout, stderr } = await execAsync(updateCommand, { timeout: 60000 })

    // Get the new version
    const { stdout: lsOutput } = await execAsync(`npm ls ${name} --json --depth=0`)
    const lsData = JSON.parse(lsOutput)
    const newVersion = lsData.dependencies?.[name]?.version

    // Update the database if it exists
    const supabase = createAdminClient()

    // Check if dependencies table exists
    const { data: tableExists, error: checkError } = await supabase.rpc("check_table_exists", {
      table_name: "dependencies",
    })

    if (!checkError && tableExists) {
      // Update the dependency in the database
      const { error: updateError } = await supabase.from("dependencies").upsert(
        {
          name,
          current_version: newVersion,
          latest_version: newVersion,
          has_security_update: false,
          last_updated: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        { onConflict: "name" },
      )

      if (updateError) {
        console.error("Error updating dependency in database:", updateError)
      }
    }

    return {
      success: true,
      newVersion,
    }
  } catch (error) {
    console.error("Error updating dependency:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    }
  }
}

/**
 * Apply updates to multiple dependencies based on update mode
 */
export async function applyDependencyUpdates(
  mode: "manual" | "auto" | "conservative" | "global" = "conservative",
): Promise<{
  success: boolean
  updated: number
  failed: number
  results: any[]
}> {
  try {
    const supabase = createAdminClient()

    // Check if dependencies table exists
    const { data: tableExists, error: checkError } = await supabase.rpc("check_table_exists", {
      table_name: "dependencies",
    })

    // Get the list of dependencies to update
    let dependenciesToUpdate: string[] = []

    if (!checkError && tableExists) {
      // Get dependencies based on update mode
      const { data: deps, error: depsError } = await supabase
        .from("dependencies")
        .select("name, update_mode, has_security_update, locked")

      if (!depsError && deps) {
        // Filter dependencies based on update mode
        dependenciesToUpdate = deps
          .filter((dep) => {
            if (dep.locked) return false

            const depMode = dep.update_mode === "global" ? mode : dep.update_mode

            if (depMode === "auto") return true
            if (depMode === "conservative" && dep.has_security_update) return true
            return false
          })
          .map((dep) => dep.name)
      }
    }

    // If no dependencies in database, get outdated dependencies
    if (dependenciesToUpdate.length === 0) {
      try {
        const outdated = await getOutdatedPackages()
        dependenciesToUpdate = Object.keys(outdated)
      } catch (err) {
        // If no outdated dependencies, npm outdated exits with code 1
        console.log("No outdated dependencies found")
      }
    }

    if (dependenciesToUpdate.length === 0) {
      return {
        success: true,
        updated: 0,
        failed: 0,
        results: [],
      }
    }

    // Update each dependency
    const results = []

    for (const name of dependenciesToUpdate) {
      try {
        const result = await updateDependency(name)
        results.push({
          name,
          success: result.success,
          newVersion: result.newVersion,
          error: result.error,
        })
      } catch (error) {
        console.error(`Error updating ${name}:`, error)
        results.push({
          name,
          success: false,
          error: error instanceof Error ? error.message : String(error),
        })
      }
    }

    return {
      success: true,
      updated: results.filter((r) => r.success).length,
      failed: results.filter((r) => !r.success).length,
      results,
    }
  } catch (error) {
    console.error("Error applying updates:", error)
    return {
      success: false,
      updated: 0,
      failed: 0,
      results: [],
      error: error instanceof Error ? error.message : String(error),
    }
  }
}
