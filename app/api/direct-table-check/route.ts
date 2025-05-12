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

    // Check environment variables
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
      return NextResponse.json(
        { success: false, error: "Missing NEXT_PUBLIC_SUPABASE_URL environment variable" },
        { status: 500 },
      )
    }

    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
      return NextResponse.json(
        { success: false, error: "Missing SUPABASE_SERVICE_ROLE_KEY environment variable" },
        { status: 500 },
      )
    }

    // Create a Supabase client directly
    const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    })

    // Check if each table exists
    const results: Record<string, boolean> = {}
    const existingTables: string[] = []
    const missingTables: string[] = []

    for (const table of tables) {
      try {
        // Try to select a single row from the table
        const { data, error } = await supabase.from(table).select("*").limit(1)

        // If there's no error, the table exists
        const exists = !error
        results[table] = exists

        if (exists) {
          existingTables.push(table)
        } else {
          missingTables.push(table)
        }
      } catch (error) {
        console.error(`Error checking table ${table}:`, error)
        results[table] = false
        missingTables.push(table)
      }
    }

    return NextResponse.json({
      success: true,
      results,
      existingTables,
      missingTables,
      allExist: missingTables.length === 0,
      checkedTables: tables,
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
