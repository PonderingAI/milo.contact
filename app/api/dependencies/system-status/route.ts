import { NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase-server"
import fs from "fs"
import path from "path"
import { exec } from "child_process"
import util from "util"

const execPromise = util.promisify(exec)

// Helper function to check if a table exists
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

// Check if package.json exists
async function checkPackageJson() {
  try {
    const packageJsonPath = path.join(process.cwd(), "package.json")
    await fs.promises.access(packageJsonPath, fs.constants.F_OK)
    return { exists: true, error: null }
  } catch (error) {
    return { exists: false, error }
  }
}

// Check if npm is available
async function checkNpm() {
  try {
    await execPromise("npm --version")
    return { available: true, error: null }
  } catch (error) {
    return { available: false, error }
  }
}

export async function GET() {
  try {
    // Check database connection
    let databaseStatus = "unknown"
    let tablesStatus = "unknown"
    let packageJsonStatus = "unknown"
    let npmStatus = "unknown"

    // Check database connection
    try {
      const supabase = createAdminClient()
      const { error: connectionError } = await supabase.from("_dummy_query_").select("*").limit(1)

      // If we get a specific error about relation not existing, connection is working
      if (connectionError && connectionError.message.includes("does not exist")) {
        databaseStatus = "ok"

        // Check if dependencies table exists
        const tableExists = await checkTableExists(supabase, "dependencies")
        tablesStatus = tableExists ? "ok" : "missing"
      } else {
        databaseStatus = "error"
      }
    } catch (error) {
      databaseStatus = "error"
    }

    // Check package.json
    const { exists: packageJsonExists, error: packageJsonError } = await checkPackageJson()
    packageJsonStatus = packageJsonExists ? "ok" : "missing"

    // Check npm
    const { available: npmAvailable, error: npmError } = await checkNpm()
    npmStatus = npmAvailable ? "ok" : "error"

    return NextResponse.json({
      status: {
        database: databaseStatus,
        tables: tablesStatus,
        packageJson: packageJsonStatus,
        npm: npmStatus,
      },
      details: {
        packageJsonError: packageJsonError ? packageJsonError.message : null,
        npmError: npmError ? npmError.message : null,
      },
    })
  } catch (error) {
    console.error("Error checking system status:", error)
    return NextResponse.json(
      {
        error: "Failed to check system status",
        message: "There was an error checking the system status.",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    )
  }
}
