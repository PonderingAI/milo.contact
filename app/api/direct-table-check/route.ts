import { NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase-server"

export async function POST(request: Request) {
  try {
    const { tables } = await request.json()

    if (!Array.isArray(tables) || tables.length === 0) {
      return NextResponse.json(
        {
          error: "Invalid tables array",
        },
        { status: 400 },
      )
    }

    const supabase = createAdminClient()

    // Query all tables in the public schema
    const { data: existingTables, error: tablesError } = await supabase
      .from("information_schema.tables")
      .select("table_name")
      .eq("table_schema", "public")
      .in("table_type", ["BASE TABLE", "VIEW"])

    if (tablesError) {
      console.error("Error querying information_schema:", tablesError)
      return NextResponse.json(
        {
          error: `Database error: ${tablesError.message}`,
        },
        { status: 500 },
      )
    }

    // Convert to a set for faster lookups
    const existingTableSet = new Set(existingTables?.map((t) => t.table_name) || [])

    // Find missing tables
    const missingTables = tables.filter((table) => !existingTableSet.has(table))

    return NextResponse.json({
      existingTables: existingTables?.map((t) => t.table_name) || [],
      missingTables,
      checkedTables: tables,
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
