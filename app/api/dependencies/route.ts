import { NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase-server"
import { exec } from "child_process"
import { promisify } from "util"

const execAsync = promisify(exec)

// Helper function to get dependencies from package.json
async function getDependenciesFromPackageJson() {
  try {
    const packageJson = require("../../../package.json")
    return {
      dependencies: Object.entries(packageJson.dependencies || {}).map(([name, version]) => ({
        name,
        currentVersion: version.toString().replace(/^\^|~/, ""),
        isDev: false,
      })),
      devDependencies: Object.entries(packageJson.devDependencies || {}).map(([name, version]) => ({
        name,
        currentVersion: version.toString().replace(/^\^|~/, ""),
        isDev: true,
      })),
    }
  } catch (error) {
    console.error("Error reading package.json:", error)
    return { dependencies: [], devDependencies: [] }
  }
}

// Helper function to get outdated packages
async function getOutdatedPackages() {
  try {
    const { stdout } = await execAsync("npm outdated --json")
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

// Helper function to get security vulnerabilities
async function getSecurityVulnerabilities() {
  try {
    const { stdout } = await execAsync("npm audit --json")
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

// Helper function to sync dependencies with the database
async function syncDependenciesWithDatabase(supabase, allDeps, outdated, vulnerabilities) {
  // Get existing dependencies from the database
  const { data: existingDeps, error: fetchError } = await supabase.from("dependencies").select("*")

  if (fetchError) {
    if (fetchError.message.includes("does not exist")) {
      // Tables don't exist, try to create them
      await fetch("/api/dependencies/setup", { method: "POST" })
      return { error: "Dependencies tables don't exist. Setting up tables..." }
    }
    return { error: fetchError.message }
  }

  const existingDepsMap = new Map(existingDeps?.map((dep) => [dep.name, dep]) || [])
  const updatedDeps = []
  const newDeps = []

  // Process all dependencies
  for (const dep of allDeps) {
    const outdatedInfo = outdated[dep.name]
    const latestVersion = outdatedInfo?.latest || dep.currentVersion
    const isOutdated = !!outdatedInfo

    // Check for security vulnerabilities
    const hasSecurityIssue = vulnerabilities?.vulnerabilities?.[dep.name] !== undefined
    const securityDetails = hasSecurityIssue ? vulnerabilities?.vulnerabilities?.[dep.name] : null

    if (existingDepsMap.has(dep.name)) {
      // Update existing dependency
      const existingDep = existingDepsMap.get(dep.name)
      const updateData = {
        current_version: dep.currentVersion,
        latest_version: latestVersion,
        outdated: isOutdated,
        has_security_update: hasSecurityIssue,
        security_details: securityDetails,
        is_dev: dep.isDev,
        updated_at: new Date().toISOString(),
      }

      const { error } = await supabase.from("dependencies").update(updateData).eq("id", existingDep.id)

      if (!error) {
        updatedDeps.push({
          ...existingDep,
          ...updateData,
        })
      }
    } else {
      // Insert new dependency
      const newDep = {
        name: dep.name,
        current_version: dep.currentVersion,
        latest_version: latestVersion,
        outdated: isOutdated,
        locked: false,
        update_mode: "global",
        has_security_update: hasSecurityIssue,
        security_details: securityDetails,
        is_dev: dep.isDev,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }

      const { data, error } = await supabase.from("dependencies").insert(newDep).select()

      if (!error && data) {
        newDeps.push(data[0])
      }
    }
  }

  return {
    updated: updatedDeps.length,
    new: newDeps.length,
    total: allDeps.length,
  }
}

export async function GET() {
  try {
    const supabase = createAdminClient()

    // Try to get dependencies from the database first
    const { data: dbDeps, error: dbError } = await supabase.from("dependencies").select("*")

    // If there's an error or no dependencies in the database, get them from package.json
    if (dbError || !dbDeps || dbDeps.length === 0) {
      // If tables don't exist, set them up
      if (dbError && dbError.message.includes("does not exist")) {
        await fetch("/api/dependencies/setup", { method: "POST" })
      }

      // Get dependencies from package.json
      const { dependencies, devDependencies } = await getDependenciesFromPackageJson()
      const allDeps = [...dependencies, ...devDependencies]

      // Get outdated packages
      const outdated = await getOutdatedPackages()

      // Get security vulnerabilities
      const vulnerabilities = await getSecurityVulnerabilities()

      // Sync with database if it exists now
      const syncResult = await syncDependenciesWithDatabase(supabase, allDeps, outdated, vulnerabilities)

      if (syncResult.error) {
        // Return the dependencies from package.json directly
        const mappedDeps = allDeps.map((dep) => {
          const outdatedInfo = outdated[dep.name]
          const latestVersion = outdatedInfo?.latest || dep.currentVersion
          const isOutdated = !!outdatedInfo
          const hasSecurityIssue = vulnerabilities?.vulnerabilities?.[dep.name] !== undefined
          const securityDetails = hasSecurityIssue ? vulnerabilities?.vulnerabilities?.[dep.name] : null

          return {
            id: dep.name,
            name: dep.name,
            currentVersion: dep.currentVersion,
            latestVersion,
            outdated: isOutdated,
            locked: false,
            updateMode: "global",
            hasSecurityIssue,
            securityDetails,
            isDev: dep.isDev,
          }
        })

        // Calculate security stats
        const vulnerabilityCount = Object.keys(vulnerabilities?.vulnerabilities || {}).length
        const outdatedCount = Object.keys(outdated).length
        const securityScore = calculateSecurityScore(mappedDeps)

        return NextResponse.json({
          dependencies: mappedDeps,
          vulnerabilities: vulnerabilityCount,
          outdatedPackages: outdatedCount,
          securityScore,
          lastScan: new Date().toISOString(),
          updateMode: "conservative",
          setupNeeded: true,
          setupMessage: syncResult.error,
        })
      }

      // Try to get dependencies from the database again after sync
      const { data: syncedDeps, error: syncedError } = await supabase.from("dependencies").select("*")

      if (syncedError || !syncedDeps || syncedDeps.length === 0) {
        return NextResponse.json(
          {
            error: "Failed to retrieve dependencies after sync",
            details: syncedError?.message,
          },
          { status: 500 },
        )
      }

      // Map database dependencies to the expected format
      const mappedDeps = syncedDeps.map((dep) => ({
        id: dep.id,
        name: dep.name,
        currentVersion: dep.current_version,
        latestVersion: dep.latest_version,
        outdated: dep.outdated,
        locked: dep.locked,
        updateMode: dep.update_mode,
        hasSecurityIssue: dep.has_security_update,
        securityDetails: dep.security_details,
        isDev: dep.is_dev,
      }))

      // Get global settings
      const { data: settings } = await supabase.from("dependency_settings").select("*").limit(1)
      const globalUpdateMode = settings?.[0]?.update_mode || "conservative"

      // Calculate security stats
      const vulnerabilityCount = mappedDeps.filter((dep) => dep.hasSecurityIssue).length
      const outdatedCount = mappedDeps.filter((dep) => dep.outdated).length
      const securityScore = calculateSecurityScore(mappedDeps)

      return NextResponse.json({
        dependencies: mappedDeps,
        vulnerabilities: vulnerabilityCount,
        outdatedPackages: outdatedCount,
        securityScore,
        lastScan: new Date().toISOString(),
        updateMode: globalUpdateMode,
      })
    }

    // Map database dependencies to the expected format
    const mappedDeps = dbDeps.map((dep) => ({
      id: dep.id,
      name: dep.name,
      currentVersion: dep.current_version,
      latestVersion: dep.latest_version,
      outdated: dep.outdated,
      locked: dep.locked,
      updateMode: dep.update_mode,
      hasSecurityIssue: dep.has_security_update,
      securityDetails: dep.security_details,
      isDev: dep.is_dev,
    }))

    // Get global settings
    const { data: settings } = await supabase.from("dependency_settings").select("*").limit(1)
    const globalUpdateMode = settings?.[0]?.update_mode || "conservative"

    // Calculate security stats
    const vulnerabilityCount = mappedDeps.filter((dep) => dep.hasSecurityIssue).length
    const outdatedCount = mappedDeps.filter((dep) => dep.outdated).length
    const securityScore = calculateSecurityScore(mappedDeps)

    return NextResponse.json({
      dependencies: mappedDeps,
      vulnerabilities: vulnerabilityCount,
      outdatedPackages: outdatedCount,
      securityScore,
      lastScan: new Date().toISOString(),
      updateMode: globalUpdateMode,
    })
  } catch (error) {
    console.error("Error in dependencies API:", error)
    return NextResponse.json(
      {
        error: "An unexpected error occurred",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    )
  }
}

// Helper function to calculate security score
function calculateSecurityScore(deps) {
  const totalDeps = deps.length
  if (totalDeps === 0) return 100

  const vulnerableDeps = deps.filter((d) => d.hasSecurityIssue).length
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

export async function POST(request: Request) {
  try {
    const supabase = createAdminClient()
    const body = await request.json()
    const { id, name, current_version, latest_version, locked, locked_version, update_mode } = body

    // Check if dependencies table exists
    const { data: tableExists, error: checkError } = await supabase.rpc("check_table_exists", {
      table_name: "dependencies",
    })

    if (checkError) {
      console.error("Error checking if dependencies table exists:", checkError)
      return NextResponse.json(
        {
          error: "Failed to check if dependencies table exists",
          details: checkError.message,
        },
        { status: 500 },
      )
    }

    // If table doesn't exist, return appropriate message
    if (!tableExists) {
      return NextResponse.json(
        {
          error: "Dependencies table does not exist",
          tablesMissing: true,
        },
        { status: 404 },
      )
    }

    // If id is provided, update existing dependency
    if (id) {
      const updateData: any = {}

      if (locked !== undefined) updateData.locked = locked
      if (locked_version !== undefined) updateData.locked_version = locked_version
      if (update_mode !== undefined) updateData.update_mode = update_mode
      if (latest_version !== undefined) updateData.latest_version = latest_version
      if (current_version !== undefined) updateData.current_version = current_version

      updateData.updated_at = new Date().toISOString()

      const { error: updateError } = await supabase.from("dependencies").update(updateData).eq("id", id)

      if (updateError) {
        console.error("Error updating dependency:", updateError)
        return NextResponse.json(
          {
            error: "Failed to update dependency",
            details: updateError.message,
          },
          { status: 500 },
        )
      }

      return NextResponse.json({ success: true, message: "Dependency updated successfully" })
    }

    // If name is provided, add new dependency
    if (name && current_version) {
      const { error: insertError } = await supabase.from("dependencies").insert({
        name,
        current_version,
        latest_version: latest_version || current_version,
        locked: locked || false,
        locked_version: locked_version,
        update_mode: update_mode || "global",
      })

      if (insertError) {
        console.error("Error adding dependency:", insertError)
        return NextResponse.json(
          {
            error: "Failed to add dependency",
            details: insertError.message,
          },
          { status: 500 },
        )
      }

      return NextResponse.json({ success: true, message: "Dependency added successfully" })
    }

    return NextResponse.json(
      {
        error: "Invalid request. Missing required fields.",
      },
      { status: 400 },
    )
  } catch (error) {
    console.error("Error in dependencies API:", error)
    return NextResponse.json(
      {
        error: "An unexpected error occurred",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    )
  }
}
