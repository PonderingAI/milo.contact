import { NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase-server"
import { getTableByName } from "@/lib/database-schema"

export async function POST(request: Request) {
  try {
    const { tables } = await request.json()

    // Validate table names
    const invalidTables = tables.filter((tableName) => !getTableByName(tableName))
    if (invalidTables.length > 0) {
      return NextResponse.json(
        {
          error: `The following tables are not defined in the database schema: ${invalidTables.join(", ")}`,
        },
        { status: 400 },
      )
    }

    const supabase = createAdminClient()
    const missingTables = []

    // Check each table
    for (const tableName of tables) {
      try {
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
        console.error(`Error checking if ${tableName} exists:`, error)
        missingTables.push(tableName)
      }
    }

    return NextResponse.json({
      missingTables,
      allExist: missingTables.length === 0,
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
