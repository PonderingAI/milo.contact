import { NextResponse } from "next/server"
import fs from "fs"
import path from "path"
import { createClient } from "@/lib/supabase-server"
import { auth } from "@clerk/nextjs/server"

// Add this function at the top of the file, before the GET handler

async function checkTablesExist(supabase: any) {
  try {
    // Check if the dependencies table exists
    const { data: dependenciesExists, error: dependenciesError } = await supabase
      .from("dependencies")
      .select("id")
      .limit(1)
      .maybeSingle()

    // Check if the dependency_settings table exists
    const { data: settingsExists, error: settingsError } = await supabase
      .from("dependency_settings")
      .select("id")
      .limit(1)
      .maybeSingle()

    // If we get a "relation does not exist" error, the table doesn't exist
    const dependenciesTableMissing = dependenciesError?.message?.includes('relation "dependencies" does not exist')
    const settingsTableMissing = settingsError?.message?.includes('relation "dependency_settings" does not exist')

    return {
      tablesExist: !dependenciesTableMissing && !settingsTableMissing,
      dependenciesTableExists: !dependenciesTableMissing,
      settingsTableExists: !settingsTableMissing,
    }
  } catch (error) {
    console.error("Error checking tables:", error)
    return { tablesExist: false, dependenciesTableExists: false, settingsTableExists: false }
  }
}

// Helper function to get dependencies from package.json
async function getDependenciesFromPackageJson() {
  try {
    // Try to read package.json directly from the file system
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
    return { dependencies: [], devDependencies: [] }
  }
}

// Then update the GET handler to check for tables first

export async function GET(request: Request) {
  try {
    // Check authentication
    const { userId } = auth()
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Connect to Supabase
    const supabase = createClient()

    // Check if tables exist
    const { tablesExist } = await checkTablesExist(supabase)

    if (!tablesExist) {
      return NextResponse.json({
        setupNeeded: true,
        setupMessage: "The dependency system needs to be set up before it can be used.",
        dependencies: [],
      })
    }

    // If table exists, fetch dependencies
    const { data: dependencies, error: fetchError } = await supabase.from("dependencies").select("*").order("name")

    if (fetchError) {
      console.error("Error fetching dependencies:", fetchError)
      return NextResponse.json({
        dependencies: [],
        error: "Failed to fetch dependencies",
        tableExists: true,
      })
    }

    // If no dependencies found, try to scan
    if (!dependencies || dependencies.length === 0) {
      try {
        // Try to scan dependencies
        const scanResponse = await fetch(
          new URL("/api/dependencies/scan", new URL(process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000")),
          {
            method: "POST",
          },
        )

        if (scanResponse.ok) {
          // If scan was successful, fetch dependencies again
          const { data: freshDependencies } = await supabase.from("dependencies").select("*").order("name")

          if (freshDependencies && freshDependencies.length > 0) {
            // Get global update mode from settings
            const { data: settings } = await supabase
              .from("dependency_settings")
              .select("update_mode, last_scan")
              .single()

            // Calculate security stats
            const vulnerableDeps = freshDependencies.filter((d) => d.has_security_issue).length
            const outdatedDeps = freshDependencies.filter((d) => d.outdated).length

            return NextResponse.json({
              dependencies: freshDependencies,
              vulnerabilities: vulnerableDeps,
              outdatedPackages: outdatedDeps,
              securityScore: Math.max(0, 100 - vulnerableDeps * 10 - outdatedDeps * 5),
              lastScan: settings?.last_scan || new Date().toISOString(),
              updateMode: settings?.update_mode || "conservative",
              tableExists: true,
            })
          }
        }
      } catch (scanError) {
        console.error("Error scanning dependencies:", scanError)
      }

      // If we still don't have dependencies, return empty array with message
      return NextResponse.json({
        dependencies: [],
        tableExists: true,
        scanNeeded: true,
        message: "No dependencies found. Please run a dependency scan.",
      })
    }

    // Get global update mode from settings
    const { data: settings } = await supabase.from("dependency_settings").select("update_mode, last_scan").single()

    // Calculate security stats
    const vulnerableDeps = dependencies.filter((d) => d.has_security_issue).length
    const outdatedDeps = dependencies.filter((d) => d.outdated).length

    return NextResponse.json({
      dependencies,
      vulnerabilities: vulnerableDeps,
      outdatedPackages: outdatedDeps,
      securityScore: Math.max(0, 100 - vulnerableDeps * 10 - outdatedDeps * 5),
      lastScan: settings?.last_scan || new Date().toISOString(),
      updateMode: settings?.update_mode || "conservative",
      tableExists: true,
    })
  } catch (error) {
    console.error("Error in dependencies API:", error)

    // Try to get dependencies from package.json as a fallback
    try {
      const { dependencies, devDependencies } = await getDependenciesFromPackageJson()
      const allDeps = [...dependencies, ...devDependencies]

      if (allDeps.length > 0) {
        return NextResponse.json({
          dependencies: allDeps.map((dep) => ({
            id: dep.name,
            name: dep.name,
            currentVersion: dep.current_version,
            latestVersion: dep.current_version,
            outdated: false,
            locked: false,
            hasSecurityIssue: false,
            is_dev: dep.is_dev,
            description: "Loaded from package.json",
            updateMode: "global",
          })),
          setupNeeded: true,
          tableExists: false,
          message: "Using package.json as fallback. Please set up the dependency system for full functionality.",
        })
      }
    } catch (fallbackError) {
      console.error("Error getting fallback dependencies:", fallbackError)
    }

    return NextResponse.json({
      dependencies: [],
      setupNeeded: true,
      tableExists: false,
      error: "An unexpected error occurred",
      message: "There was an unexpected error processing your request.",
      details: error instanceof Error ? error.message : String(error),
    })
  }
}
