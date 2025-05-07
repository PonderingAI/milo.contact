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

export async function GET() {
  try {
    // Check if we have access to package.json
    let packageJson
    try {
      const packageJsonPath = require.resolve("../../../package.json")
      const packageJsonContent = fs.readFileSync(packageJsonPath, "utf8")
      packageJson = JSON.parse(packageJsonContent)
    } catch (error) {
      console.error("Error reading package.json:", error)
      return NextResponse.json(
        {
          error: "Could not read package.json",
          dependencies: {},
          devDependencies: {},
        },
        { status: 500 },
      )
    }

    // Get dependencies from package.json
    const dependencies = packageJson.dependencies || {}
    const devDependencies = packageJson.devDependencies || {}

    // Check if the dependencies table exists in the database
    const supabase = createAdminClient()
    const { data: tableExists, error: tableCheckError } = await supabase.rpc("check_table_exists", {
      table_name: "dependencies",
    })

    if (tableCheckError) {
      console.error("Error checking if dependencies table exists:", tableCheckError)
      return NextResponse.json({
        dependencies,
        devDependencies,
        databaseStatus: "error",
        error: "Could not check if dependencies table exists",
      })
    }

    // If the table doesn't exist, just return the dependencies from package.json
    if (!tableExists) {
      return NextResponse.json({
        dependencies,
        devDependencies,
        databaseStatus: "table_missing",
      })
    }

    // Get dependencies from the database
    const { data: dbDependencies, error: dbError } = await supabase.from("dependencies").select("*")

    if (dbError) {
      console.error("Error fetching dependencies from database:", dbError)
      return NextResponse.json({
        dependencies,
        devDependencies,
        databaseStatus: "error",
        error: "Could not fetch dependencies from database",
      })
    }

    // Get dependency settings
    const { data: settings, error: settingsError } = await supabase.from("dependency_settings").select("*").limit(1)

    const dependencySettings = settings && settings.length > 0 ? settings[0] : null

    // Return both package.json dependencies and database dependencies
    return NextResponse.json({
      dependencies,
      devDependencies,
      dbDependencies: dbDependencies || [],
      settings: dependencySettings,
      databaseStatus: "ok",
    })
  } catch (error) {
    console.error("Error in dependencies API:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

import fs from "fs"

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
