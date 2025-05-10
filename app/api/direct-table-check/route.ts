import { NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase-server"

export async function POST(request: Request) {
  try {
    const { tables } = await request.json()

    if (!Array.isArray(tables) || tables.length === 0) {
      return NextResponse.json(
        {
          error: "Invalid request: tables must be a non-empty array",
        },
        { status: 400 },
      )
    }

    const supabase = createAdminClient()
    const missingTables = []

    // Use a more direct approach to check if tables exist
    const { data: existingTables, error } = await supabase
      .from("information_schema.tables")
      .select("table_name")
      .eq("table_schema", "public")
      .in("table_name", tables)

    if (error) {
      console.error("Error querying information_schema:", error)
      return NextResponse.json(
        {
          error: `Database error: ${error.message}`,
        },
        { status: 500 },
      )
    }

    // Create a set of existing table names for faster lookup
    const existingTableSet = new Set(existingTables?.map((t) => t.table_name) || [])

    // Find which tables are missing
    for (const tableName of tables) {
      if (!existingTableSet.has(tableName)) {
        missingTables.push(tableName)
      }
    }

    // Log the results for debugging
    console.log(`Checked ${tables.length} tables, found ${missingTables.length} missing tables`)
    console.log("Missing tables:", missingTables)

    return NextResponse.json({
      missingTables,
      allExist: missingTables.length === 0,
      checkedTables: tables,
      existingTables: Array.from(existingTableSet),
    })
  } catch (error) {
    console.error("Error checking tables:", error)
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
