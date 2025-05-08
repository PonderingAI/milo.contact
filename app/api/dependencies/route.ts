import { NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase-server"

// Hardcoded dependencies as fallback
const FALLBACK_DEPENDENCIES = [
  {
    name: "next",
    current_version: "14.0.3",
    latest_version: "14.0.3",
    is_dev: false,
    description: "The React Framework for the Web",
  },
  {
    name: "react",
    current_version: "18.2.0",
    latest_version: "18.2.0",
    is_dev: false,
    description: "React is a JavaScript library for building user interfaces.",
  },
  {
    name: "react-dom",
    current_version: "18.2.0",
    latest_version: "18.2.0",
    is_dev: false,
    description: "React package for working with the DOM.",
  },
  {
    name: "@supabase/supabase-js",
    current_version: "2.38.4",
    latest_version: "2.38.4",
    is_dev: false,
    description: "Supabase client for JavaScript",
  },
  {
    name: "nodemailer",
    current_version: "6.9.9",
    latest_version: "6.9.9",
    is_dev: false,
    description: "Easy as cake e-mail sending from your Node.js applications",
  },
  {
    name: "tailwindcss",
    current_version: "3.3.0",
    latest_version: "3.3.0",
    is_dev: false,
    description: "A utility-first CSS framework for rapidly building custom user interfaces.",
  },
  {
    name: "typescript",
    current_version: "5.0.4",
    latest_version: "5.0.4",
    is_dev: true,
    description: "TypeScript is a language for application scale JavaScript development",
  },
  {
    name: "eslint",
    current_version: "8.38.0",
    latest_version: "8.38.0",
    is_dev: true,
    description: "An AST-based pattern checker for JavaScript.",
  },
  {
    name: "@types/react",
    current_version: "18.0.28",
    latest_version: "18.0.28",
    is_dev: true,
    description: "TypeScript definitions for React",
  },
  {
    name: "@types/node",
    current_version: "18.15.11",
    latest_version: "18.15.11",
    is_dev: true,
    description: "TypeScript definitions for Node.js",
  },
]

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
            dependencies: FALLBACK_DEPENDENCIES,
            fallback: true,
            tableExists: false,
          },
          { status: 200 },
        ) // Return 200 with fallback data
      }
    }

    // Check if dependencies table exists without using RPC
    const tableExists = await checkTableExists(supabase, "dependencies")

    // If table doesn't exist, return fallback data
    if (!tableExists) {
      return NextResponse.json({
        dependencies: FALLBACK_DEPENDENCIES,
        tableExists: false,
        message: "Dependencies table does not exist. Using fallback data.",
        fallback: true,
      })
    }

    // Get dependencies from database
    const { data: dbDeps, error: fetchError } = await supabase.from("dependencies").select("*")

    if (fetchError) {
      console.error("Error fetching dependencies from database:", fetchError)
      return NextResponse.json(
        {
          error: "Failed to fetch dependencies from database",
          details: fetchError.message,
          dependencies: FALLBACK_DEPENDENCIES,
          fallback: true,
        },
        { status: 200 },
      ) // Return 200 with fallback data
    }

    // If no dependencies in database, return fallback
    if (!dbDeps || dbDeps.length === 0) {
      return NextResponse.json({
        dependencies: FALLBACK_DEPENDENCIES,
        tableExists: true,
        message: "No dependencies found in database. Using fallback data.",
        fallback: true,
      })
    }

    // Calculate security score (simplified)
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

    // Always return a 200 with fallback data instead of 500
    return NextResponse.json(
      {
        error: "An unexpected error occurred, using fallback data",
        details: error instanceof Error ? error.message : String(error),
        dependencies: FALLBACK_DEPENDENCIES,
        fallback: true,
        tableExists: false,
      },
      { status: 200 },
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
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
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
