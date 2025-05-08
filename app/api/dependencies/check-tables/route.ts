import { NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase-server"

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

    // Check if dependencies table exists without using RPC
    const depsTableExists = await checkTableExists(supabase, "dependencies")

    // Check if dependency_settings table exists without using RPC
    const settingsTableExists = await checkTableExists(supabase, "dependency_settings")

    return NextResponse.json({
      success: true,
      tables: {
        dependencies: depsTableExists,
        dependency_settings: settingsTableExists,
      },
    })
  } catch (error) {
    console.error("Error checking tables:", error)
    return NextResponse.json(
      {
        error: "Failed to check tables",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    )
  }
}
