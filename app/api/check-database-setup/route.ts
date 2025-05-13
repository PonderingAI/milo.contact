import { createClient } from "@/lib/supabase-server"
import { NextResponse } from "next/server"

export async function GET() {
  try {
    const supabase = createClient()

    // Check if core tables exist - specifically include projects table
    const coreTables = ["user_roles", "site_settings", "projects"]
    const missingTables: string[] = []

    for (const table of coreTables) {
      try {
        const { data, error } = await supabase.from(table).select("id").limit(1).maybeSingle()

        if (error && error.code === "PGRST116") {
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
      { isSetup: false, error: error instanceof Error ? error.message : String(error) },
      { status: 500 },
    )
  }
}
