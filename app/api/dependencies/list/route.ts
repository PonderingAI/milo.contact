import { NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase-server"
import fs from "fs"
import path from "path"

// Helper function to check if a table exists without using RPC
async function checkTableExists(supabase, tableName) {
  try {
    // Query the information_schema to check if the table exists
    const { data, error } = await supabase
      .from("information_schema.tables")
      .select("table_name")
      .eq("table_schema", "public")
      .eq("table_name", tableName)
      .single()

    if (error) {
      console.error(`Error checking if ${tableName} exists:`, error)
      return false
    }

    return !!data
  } catch (error) {
    console.error(`Error in checkTableExists for ${tableName}:`, error)
    return false
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

export async function GET() {
  try {
    const supabase = createAdminClient()

    // First, check if we can connect to Supabase at all
    try {
      const { error: connectionError } = await supabase.from("_dummy_query_").select("*").limit(1)

      // If we get a specific error about relation not existing, connection is working
      if (connectionError && !connectionError.message.includes("does not exist")) {
        console.error("Supabase connection error:", connectionError)
        throw new Error("Failed to connect to Supabase")
      }
    } catch (connectionError) {
      // If this is not a "relation does not exist" error, there's a connection issue
      if (
        connectionError instanceof Error &&
        !connectionError.message.includes("does not exist") &&
        !connectionError.message.includes("_dummy_query_")
      ) {
        console.error("Supabase connection test failed:", connectionError)
        return NextResponse.json(
          {
            error: "Database connection failed",
            message: "Could not connect to the database. Please check your connection settings.",
            details: connectionError instanceof Error ? connectionError.message : String(connectionError),
          },
          { status: 500 },
        )
      }
    }

    // Check if dependencies table exists
    const tableExists = await checkTableExists(supabase, "dependencies")

    // If table doesn't exist, return appropriate error
    if (!tableExists) {
      return NextResponse.json(
        {
          error: "Dependencies table does not exist",
          message: "The dependencies table has not been set up. Please set up the table first.",
          tableExists: false,
          setupNeeded: true,
          setupMessage: "The dependency management system needs to be set up. Please run the setup process.",
        },
        { status: 404 },
      )
    }

    // Get dependencies from database
    const { data: dbDeps, error: fetchError } = await supabase.from("dependencies").select("*")

    if (fetchError) {
      console.error("Error fetching dependencies from database:", fetchError)
      return NextResponse.json(
        {
          error: "Failed to fetch dependencies from database",
          message: "There was an error retrieving dependencies from the database.",
          details: fetchError.message,
        },
        { status: 500 },
      )
    }

    // If no dependencies in database, return empty array with clear message
    if (!dbDeps || dbDeps.length === 0) {
      // Try to get dependencies from package.json as a fallback
      const { dependencies, devDependencies } = await getDependenciesFromPackageJson()
      const allDeps = [...dependencies, ...devDependencies]

      if (allDeps.length > 0) {
        return NextResponse.json({
          dependencies: allDeps.map((dep) => ({
            id: dep.name,
            name: dep.name,
            current_version: dep.current_version,
            latest_version: dep.current_version, // We don't know the latest version
            outdated: false, // We don't know if it's outdated
            locked: false,
            has_security_update: false, // We don't know if it has security issues
            is_dev: dep.is_dev,
            description: "Loaded from package.json",
            update_mode: "global",
          })),
          message: "Dependencies loaded from package.json. Run a security scan for complete information.",
          loadedFrom: "package.json",
          tableExists: true,
        })
      }

      return NextResponse.json({
        dependencies: [],
        tableExists: true,
        message: "No dependencies found in database. Please run a dependency scan.",
        empty: true,
      })
    }

    // Calculate security score
    const vulnerableDeps = dbDeps.filter((d) => d.has_security_update).length
    const outdatedDeps = dbDeps.filter((d) => d.outdated).length
    const securityScore = Math.max(0, Math.min(100, 100 - vulnerableDeps * 10 - outdatedDeps * 5))

    return NextResponse.json({
      dependencies: dbDeps,
      vulnerabilities: vulnerableDeps,
      outdatedPackages: outdatedDeps,
      securityScore,
      lastScan: new Date().toISOString(),
      tableExists: true,
    })
  } catch (error) {
    console.error("Error in dependencies API:", error)
    return NextResponse.json(
      {
        error: "An unexpected error occurred",
        message: "There was an unexpected error processing your request.",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    )
  }
}
