import { NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase-server"
import { exec } from "child_process"
import { promisify } from "util"
import fs from "fs"
import path from "path"

const execAsync = promisify(exec)

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
      // Try alternative method if this fails
      return await fallbackTableCheck(supabase, tableName)
    }

    return !!data
  } catch (error) {
    console.error(`Error in checkTableExists for ${tableName}:`, error)
    // Try alternative method if this fails
    return await fallbackTableCheck(supabase, tableName)
  }
}

// Fallback method to check if a table exists
async function fallbackTableCheck(supabase, tableName) {
  try {
    // Try to query the table directly with a limit
    const { error } = await supabase.from(tableName).select("*").limit(1)

    // If no error, table exists
    return !error
  } catch (error) {
    console.error(`Fallback check failed for ${tableName}:`, error)
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
          },
          { status: 500 },
        )
      }
    }

    // Check if dependencies table exists without using RPC
    const tableExists = await checkTableExists(supabase, "dependencies")

    // If table doesn't exist, return appropriate error
    if (!tableExists) {
      return NextResponse.json(
        {
          error: "Dependencies table does not exist",
          message: "The dependencies table has not been set up. Please set up the table first.",
          tableExists: false,
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

    // If no dependencies in database, return empty array
    if (!dbDeps || dbDeps.length === 0) {
      return NextResponse.json({
        dependencies: [],
        tableExists: true,
        message: "No dependencies found in database.",
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

export async function POST(request: Request) {
  try {
    const supabase = createAdminClient()
    const body = await request.json()
    const { id, name, current_version, latest_version, locked, locked_version, update_mode } = body

    // Check if dependencies table exists without using RPC
    const tableExists = await checkTableExists(supabase, "dependencies")

    // If table doesn't exist, return appropriate message
    if (!tableExists) {
      return NextResponse.json(
        {
          error: "Dependencies table does not exist",
          message: "The dependencies table has not been set up. Please set up the table first.",
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
            message: "There was an error updating the dependency in the database.",
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
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })

      if (insertError) {
        console.error("Error adding dependency:", insertError)
        return NextResponse.json(
          {
            error: "Failed to add dependency",
            message: "There was an error adding the dependency to the database.",
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
        message: "The request is missing required fields.",
      },
      { status: 400 },
    )
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
