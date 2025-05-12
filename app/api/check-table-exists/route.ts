import { createClient } from "@/lib/supabase-server"
import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    const { tableName } = await request.json()

    if (!tableName) {
      return NextResponse.json({ error: "Table name is required" }, { status: 400 })
    }

    const supabase = createClient()

    // Query to check if table exists
    const { data, error } = await supabase
      .from("information_schema.tables")
      .select("table_name")
      .eq("table_schema", "public")
      .eq("table_name", tableName)
      .single()

    if (error) {
      console.error("Error checking if table exists:", error)
      return NextResponse.json(
        {
          exists: false,
          error: error.message,
          details: "Database query failed",
        },
        { status: 500 },
      )
    }

    return NextResponse.json({ exists: !!data })
  } catch (error) {
    console.error("Error checking if table exists:", error)
    return NextResponse.json(
      {
        exists: false,
        error: error instanceof Error ? error.message : "Unknown error",
        details: "Server error occurred",
      },
      { status: 500 },
    )
  }
}
