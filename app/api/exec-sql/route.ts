import { NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase-server"

export async function POST(request: Request) {
  try {
    const { sql_query } = await request.json()

    if (!sql_query) {
      return NextResponse.json(
        {
          error: "No SQL query provided",
        },
        { status: 400 },
      )
    }

    const supabase = createAdminClient()

    // Create the exec_sql function if it doesn't exist
    await supabase.rpc("create_exec_sql_function").catch((error) => {
      // If it already exists, that's fine
      if (!error.message.includes("already exists")) {
        console.warn("Error creating exec_sql function:", error)
      }
    })

    // Execute the SQL query
    const { data, error } = await supabase.rpc("exec_sql", {
      sql_query,
    })

    if (error) {
      throw error
    }

    return NextResponse.json({
      success: true,
      result: data,
    })
  } catch (error) {
    console.error("Error executing SQL:", error)
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
