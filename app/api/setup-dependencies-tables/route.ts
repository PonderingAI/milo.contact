import { NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase-server"

export async function POST(request: Request) {
  try {
    const supabase = createAdminClient()
    const body = await request.json()
    const { sql } = body

    if (!sql) {
      return NextResponse.json(
        {
          error: "SQL is required",
        },
        { status: 400 },
      )
    }

    // Execute the SQL
    const { error } = await supabase.rpc("run_sql", { sql })

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
      message: "SQL executed successfully",
    })
  } catch (error) {
    console.error("Error in setup-dependencies-tables API:", error)
    return NextResponse.json(
      {
        error: "An unexpected error occurred",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    )
  }
}
