import { NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase-server"

export async function GET() {
  try {
    const supabase = createAdminClient()

    // List of tables to check
    const tables = ["dependencies", "dependency_settings"]
    const results = {}

    // Check each table
    for (const table of tables) {
      try {
        const { data, error } = await supabase
          .from("information_schema.tables")
          .select("table_name")
          .eq("table_schema", "public")
          .eq("table_name", table)
          .single()

        results[table] = !error && !!data
      } catch (error) {
        console.error(`Error checking if ${table} exists:`, error)
        results[table] = false
      }
    }

    return NextResponse.json({
      tables: results,
      allExist: Object.values(results).every(Boolean),
    })
  } catch (error) {
    console.error("Error checking tables:", error)
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Unknown error",
        message: "Failed to check database tables.",
      },
      { status: 500 },
    )
  }
}
