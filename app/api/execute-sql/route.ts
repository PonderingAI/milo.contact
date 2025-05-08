import { NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase-server"

export async function POST(request: Request) {
  try {
    const supabase = createAdminClient()
    const { sql } = await request.json()

    if (!sql) {
      return NextResponse.json(
        {
          error: "SQL query is required",
        },
        { status: 400 },
      )
    }

    // Execute the SQL directly using PostgreSQL's EXECUTE
    // This is a workaround for when RPC functions aren't available
    const { data, error } = await supabase.from("_direct_sql_execution").rpc("sql", {
      query: sql,
    })

    if (error) {
      console.error("Error executing SQL:", error)
      return NextResponse.json(
        {
          error: "Failed to execute SQL",
          details: error.message,
        },
        { status: 500 },
      )
    }

    return NextResponse.json({
      success: true,
      data,
    })
  } catch (error) {
    console.error("Error in execute-sql API:", error)
    return NextResponse.json(
      {
        error: "An unexpected error occurred",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    )
  }
}
