import { NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase-server"
import fs from "fs"
import path from "path"

// Helper function to get package.json
async function getPackageJson() {
  const packageJsonPath = path.join(process.cwd(), "package.json")
  try {
    const packageJsonContent = await fs.promises.readFile(packageJsonPath, "utf8")
    return JSON.parse(packageJsonContent)
  } catch (error) {
    console.error("Error reading package.json:", error)
    throw new Error("Failed to read package.json")
  }
}

export async function GET() {
  try {
    const supabase = createAdminClient()

    // Get settings from database
    const { data: settings, error: settingsError } = await supabase
      .from("dependency_settings")
      .select("*")
      .limit(1)
      .single()

    if (settingsError && settingsError.code !== "PGRST116") {
      console.error("Error fetching dependency settings:", settingsError)
      return NextResponse.json(
        {
          error: "Failed to fetch dependency settings",
          details: settingsError.message,
        },
        { status: 500 },
      )
    }

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

    // If table doesn't exist, return empty data
    if (!tableExists) {
      console.log("Dependencies table does not exist")
      return NextResponse.json({
        dependencies: [],
        updateMode: settings?.update_mode || "conservative",
        securityScore: 100,
        vulnerabilities: 0,
        outdatedPackages: 0,
        message: "Dependencies table not found",
      })
    }

    // Get existing dependencies from database
    const { data: existingDeps, error: depsError } = await supabase.from("dependencies").select("*")

    if (depsError) {
      console.error("Error fetching existing dependencies:", depsError)
      return NextResponse.json(
        {
          error: "Failed to fetch dependencies",
          details: depsError.message,
        },
        { status: 500 },
      )
    }

    // Create a map of existing dependencies for quick lookup
    const existingDepsMap = {}
    if (existingDeps) {
      existingDeps.forEach((dep) => {
        existingDepsMap[dep.name] = dep
      })
    }

    // Get actual dependencies from package.json
    let packageJson
    try {
      packageJson = await getPackageJson()
    } catch (error) {
      console.error("Error reading package.json:", error)
      return NextResponse.json(
        {
          error: "Failed to read package.json",
          details: error instanceof Error ? error.message : String(error),
        },
        { status: 500 },
      )
    }

    // Combine dependencies and devDependencies
    const allPackageJsonDeps = {
      ...Object.entries(packageJson.dependencies || {}).map(([name, version]) => ({
        name,
        version: version.toString().replace(/^\^|~/, ""),
        isDev: false,
      })),
      ...Object.entries(packageJson.devDependencies || {}).map(([name, version]) => ({
        name,
        version: version.toString().replace(/^\^|~/, ""),
        isDev: true,
      })),
    }

    // Process all dependencies
    const allDependencies = Object.values(existingDepsMap).map((dep) => {
      const packageInfo = allPackageJsonDeps[dep.name]

      return {
        id: dep.id,
        name: dep.name,
        currentVersion: dep.current_version,
        latestVersion: dep.latest_version,
        outdated: dep.current_version !== dep.latest_version,
        locked: dep.locked || false,
        description: dep.description || "",
        hasSecurityIssue: dep.has_security_issue || false,
        securityDetails: dep.security_details,
        updateMode: dep.update_mode || "global",
        isDev: packageInfo?.isDev || dep.is_dev || false,
      }
    })

    // Calculate security stats
    const vulnerabilities = allDependencies.filter((d) => d.hasSecurityIssue).length
    const outdatedPackages = allDependencies.filter((d) => d.outdated).length

    // Calculate security score
    let securityScore = 100

    // Deduct for vulnerabilities
    securityScore -= vulnerabilities * 10

    // Deduct less for outdated packages
    securityScore -= Math.min(10, outdatedPackages * 2)

    // Ensure score is between 0 and 100
    securityScore = Math.max(0, Math.min(100, securityScore))

    return NextResponse.json({
      dependencies: allDependencies,
      updateMode: settings?.update_mode || "conservative",
      securityScore,
      vulnerabilities,
      outdatedPackages,
    })
  } catch (error) {
    console.error("Error in dependencies API:", error)
    return NextResponse.json({ error: "Failed to fetch dependencies" }, { status: 500 })
  }
}
