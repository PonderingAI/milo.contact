import { NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase-server"

export async function GET() {
  try {
    const supabase = createAdminClient()

    // List of tables to check
    const requiredTables = ["dependencies", "dependency_settings", "security_audits"]
    const missingTables = []

    // Check each table
    for (const table of requiredTables) {
      try {
        const { data, error } = await supabase
          .from("information_schema.tables")
          .select("table_name")
          .eq("table_schema", "public")
          .eq("table_name", table)
          .single()

        if (error || !data) {
          missingTables.push(table)
        }
      } catch (error) {
        console.error(`Error checking if ${table} exists:`, error)
        missingTables.push(table)
      }
    }

    return NextResponse.json({
      success: true,
      allTablesExist: missingTables.length === 0,
      missingTables,
      requiredTables,
    })
  } catch (error) {
    console.error("Error checking tables:", error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
        message: "Failed to check database tables.",
      },
      { status: 500 },
    )
  }
}
