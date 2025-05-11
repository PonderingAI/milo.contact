import { NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase-server"

export async function GET() {
  try {
    const supabase = createAdminClient()

    // Query all tables in the public schema
    const { data, error } = await supabase
      .from("information_schema.tables")
      .select("table_name, table_type")
      .eq("table_schema", "public")
      .order("table_name")

    if (error) {
      console.error("Error querying information_schema:", error)
      return NextResponse.json(
        {
          error: `Database error: ${error.message}`,
        },
        { status: 500 },
      )
    }

    return NextResponse.json({
      tables: data,
      count: data?.length || 0,
    })
  } catch (error) {
    console.error("Error listing tables:", error)
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
