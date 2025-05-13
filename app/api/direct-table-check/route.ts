import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

export async function POST(request: Request) {
  try {
    // Parse the request body
    const body = await request.json().catch(() => ({}))
    const { tables } = body || {}

    // Check if tables is provided and is an array
    if (!tables || !Array.isArray(tables)) {
      return NextResponse.json({ error: "Tables array is required" }, { status: 400 })
    }

    const supabaseUrl = process.env.SUPABASE_URL
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json(
        { error: "Supabase credentials are not configured", code: "MISSING_CREDENTIALS" },
        { status: 500 },
      )
    }

    const supabase = createClient(supabaseUrl, supabaseKey)

    // Check each table
    const missingTables = []

    for (const tableName of tables) {
      try {
        // Use information_schema to check if the table exists
        const { data, error } = await supabase
          .from("information_schema.tables")
          .select("table_name")
          .eq("table_schema", "public")
          .eq("table_name", tableName)
          .single()

        if (error || !data) {
          missingTables.push(tableName)
        }
      } catch (error) {
        console.warn(`Error checking table ${tableName}:`, error)
        // If we can't check, assume it's missing
        missingTables.push(tableName)
      }
    }

    return NextResponse.json({
      missingTables,
      allTablesExist: missingTables.length === 0,
    })
  } catch (error) {
    console.error("Error in direct-table-check:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
