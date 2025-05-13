import { createClient } from "@/lib/supabase-server"
import { NextResponse } from "next/server"

export async function GET() {
  try {
    const supabase = createClient()

    // Check if core tables exist
    const coreTables = ["user_roles", "site_settings", "projects"]
    const missingTables: string[] = []

    for (const table of coreTables) {
      try {
        // Use a more reliable method to check if table exists
        const { data, error } = await supabase
          .from("information_schema.tables")
          .select("table_name")
          .eq("table_schema", "public")
          .eq("table_name", table)
          .maybeSingle()

        if (error || !data) {
          console.warn(`Table ${table} not found:`, error)
          missingTables.push(table)
        }
      } catch (err) {
        console.warn(`Error checking table ${table}:`, err)
        missingTables.push(table)
      }
    }

    return NextResponse.json({
      isSetup: missingTables.length === 0,
      missingTables,
    })
  } catch (error) {
    console.error("Error checking database setup:", error)
    return NextResponse.json(
      {
        isSetup: false,
        error: error instanceof Error ? error.message : String(error),
        errorType: error instanceof Error ? error.name : "Unknown",
      },
      { status: 500 },
    )
  }
}
