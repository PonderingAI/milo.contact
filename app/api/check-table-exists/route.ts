import { NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase-server"
import { getTableByName } from "@/lib/database-schema"

export async function POST(request: Request) {
  try {
    const { tableName } = await request.json()

    // Validate table name
    const tableDefinition = getTableByName(tableName)
    if (!tableDefinition) {
      return NextResponse.json(
        {
          exists: false,
          error: `Table "${tableName}" is not defined in the database schema`,
        },
        { status: 400 },
      )
    }

    const supabase = createAdminClient()

    // Check if the table exists
    const { data, error } = await supabase
      .from("information_schema.tables")
      .select("table_name")
      .eq("table_schema", "public")
      .eq("table_name", tableName)
      .single()

    if (error) {
      // If there's an error, the table likely doesn't exist
      return NextResponse.json({ exists: false })
    }

    return NextResponse.json({ exists: !!data })
  } catch (error) {
    console.error("Error checking if table exists:", error)
    return NextResponse.json(
      {
        exists: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
