import { NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase-server"

export async function POST(request: Request) {
  try {
    const { tableName } = await request.json()

    if (!tableName || typeof tableName !== "string") {
      return NextResponse.json(
        {
          error: "Invalid request: tableName is required",
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
      // If error code is PGRST116, it means no rows were returned (table doesn't exist)
      if (error.code === "PGRST116") {
        return NextResponse.json({
          exists: false,
          tableName,
        })
      }

      console.error(`Error checking if table ${tableName} exists:`, error)
      return NextResponse.json(
        {
          error: `Database error: ${error.message}`,
        },
        { status: 500 },
      )
    }

    // If we got here, the table exists
    return NextResponse.json({
      exists: true,
      tableName,
    })
  } catch (error) {
    console.error("Error checking table:", error)
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
