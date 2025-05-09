import { NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase-server"

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

export async function GET() {
  try {
    const supabase = createAdminClient()

    // List of tables required for the dependency system
    const requiredTables = ["dependencies", "dependency_settings", "security_audits"]

    // Check each table
    const tableStatus = {}
    let allTablesExist = true

    for (const tableName of requiredTables) {
      const exists = await checkTableExists(supabase, tableName)
      tableStatus[tableName] = exists

      if (!exists) {
        allTablesExist = false
      }
    }

    return NextResponse.json({
      success: true,
      allTablesExist,
      tableStatus,
      missingTables: requiredTables.filter((table) => !tableStatus[table]),
    })
  } catch (error) {
    console.error("Error checking tables:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Failed to check tables",
        message: "There was an error checking if the required tables exist.",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    )
  }
}
