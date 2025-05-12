import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

export async function POST(request: Request) {
  try {
    // Parse the request body
    const body = await request.json()
    const { tables } = body

    if (!Array.isArray(tables)) {
      return NextResponse.json({ success: false, error: "Tables must be an array" }, { status: 400 })
    }

    // Create a Supabase client directly
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      return NextResponse.json({ success: false, error: "Missing Supabase environment variables" }, { status: 500 })
    }

    const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    })

    // Check if each table exists
    const results: Record<string, boolean> = {}

    for (const table of tables) {
      try {
        // Try to select a single row from the table
        const { data, error } = await supabase.from(table).select("*").limit(1)

        // If there's no error, the table exists
        results[table] = !error
      } catch (error) {
        console.error(`Error checking table ${table}:`, error)
        results[table] = false
      }
    }

    return NextResponse.json({
      success: true,
      results,
    })
  } catch (error) {
    console.error("Error checking tables:", error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
