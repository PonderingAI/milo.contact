import { createAdminClient } from "@/lib/supabase-server"
import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const { tables } = await request.json()

    if (!tables || !Array.isArray(tables) || tables.length === 0) {
      return NextResponse.json({ error: "Missing or invalid tables parameter" }, { status: 400 })
    }

    const supabase = createAdminClient()

    // Query information_schema directly to check which tables exist
    const { data, error } = await supabase
      .from("information_schema.tables")
      .select("table_name")
      .eq("table_schema", "public")
      .in("table_name", tables)

    if (error) {
      console.error("Error checking tables:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Get the list of tables that exist
    const existingTables = data?.map((row) => row.table_name) || []

    // Find which tables are missing
    const missingTables = tables.filter((table) => !existingTables.includes(table))

    return NextResponse.json({
      existingTables,
      missingTables,
      allTablesExist: missingTables.length === 0,
    })
  } catch (error: any) {
    console.error("Error in direct table check:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
