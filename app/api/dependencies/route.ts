import { NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase-server"
import { exec } from "child_process"
import { promisify } from "util"
import fs from "fs"
import path from "path"

const execAsync = promisify(exec)

// Helper function to get dependencies using npm CLI
async function getDependenciesFromPackageJson() {
  try {
    // Use npm list --json to get all installed dependencies
    const { stdout: listOutput } = await execAsync("npm list --json --depth=0", { timeout: 30000 })
    const npmList = JSON.parse(listOutput)

    // Extract dependencies and devDependencies
    const dependencies = Object.entries(npmList.dependencies || {}).map(([name, info]) => ({
      name,
      current_version: (info as any).version,
      is_dev: false,
    }))

    const devDependencies = []

    // Try to get dev dependencies separately
    try {
      const packageJsonPath = path.join(process.cwd(), "package.json")
      const packageJsonContent = fs.readFileSync(packageJsonPath, "utf8")
      const packageJson = JSON.parse(packageJsonContent)

      // Add dev dependencies if they exist in package.json
      if (packageJson.devDependencies) {
        Object.entries(packageJson.devDependencies).forEach(([name, version]) => {
          devDependencies.push({
            name,
            current_version: version.toString().replace(/^\^|~/, ""),
            is_dev: true,
          })
        })
      }
    } catch (devDepError) {
      console.error("Error reading dev dependencies:", devDepError)
    }

    return { dependencies, devDependencies }
  } catch (error) {
    console.error("Error getting dependencies from npm list:", error)

    // Fallback to hardcoded dependencies if we can't get them from npm list
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

// Helper function to get package descriptions from npm registry
async function getPackageDescriptions(packageNames) {
  const descriptions = {}

  for (const name of packageNames) {
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
  }

  return descriptions
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

// Helper function to calculate security score
function calculateSecurityScore(deps) {
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

export async function GET() {
  try {
    const supabase = createAdminClient()

    // Check if dependencies table exists
    const { data: tableExists, error: tableCheckError } = await supabase.rpc("check_table_exists", {
      table_name: "dependencies",
    })

    if (tableCheckError) {
      console.error("Error checking if dependencies table exists:", tableCheckError)
      return NextResponse.json(
        {
          error: "Failed to check if dependencies table exists",
          details: tableCheckError.message,
        },
        { status: 500 },
      )
    }

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

    // If table doesn't exist, return dependencies from package.json
    if (!tableExists) {
      return NextResponse.json({
        dependencies: depsWithDescriptions,
        tableExists: false,
        message: "Dependencies table does not exist. Using package.json data.",
      })
    }

    // Try to get outdated packages and security vulnerabilities
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

    // Sync dependencies with database
    for (const dep of depsWithDescriptions) {
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

    // Get all dependencies from database
    const { data: dbDeps, error: fetchError } = await supabase.from("dependencies").select("*")

    if (fetchError) {
      console.error("Error fetching dependencies from database:", fetchError)
      return NextResponse.json(
        {
          error: "Failed to fetch dependencies from database",
          details: fetchError.message,
          dependencies: depsWithDescriptions, // Return package.json data as fallback
        },
        { status: 500 },
      )
    }

    // Calculate security score
    const securityScore = calculateSecurityScore(dbDeps || [])

    return NextResponse.json({
      dependencies: dbDeps || depsWithDescriptions,
      vulnerabilities: Object.keys(vulnerabilities?.vulnerabilities || {}).length,
      outdatedPackages: Object.keys(outdated || {}).length,
      securityScore,
      lastScan: new Date().toISOString(),
      tableExists: true,
    })
  } catch (error) {
    console.error("Error in dependencies API:", error)

    // Try to get dependencies from package.json as fallback
    try {
      const { dependencies, devDependencies } = await getDependenciesFromPackageJson()
      const allDeps = [...dependencies, ...devDependencies]

      return NextResponse.json(
        {
          error: "An unexpected error occurred, using package.json as fallback",
          details: error instanceof Error ? error.message : String(error),
          dependencies: allDeps,
          fallback: true,
        },
        { status: 500 },
      )
    } catch (fallbackError) {
      return NextResponse.json(
        {
          error: "Failed to fetch dependencies",
          details: error instanceof Error ? error.message : String(error),
          fallbackError: fallbackError instanceof Error ? fallbackError.message : String(fallbackError),
        },
        { status: 500 },
      )
    }
  }
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
