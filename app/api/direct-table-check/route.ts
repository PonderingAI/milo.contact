import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { tables } = body

    if (!tables || !Array.isArray(tables) || tables.length === 0) {
      return NextResponse.json({ error: "Tables array is required" }, { status: 400 })
    }

    const supabaseUrl = process.env.SUPABASE_URL
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json(
        { error: "Supabase credentials are not configured", code: "MISSING_CREDENTIALS" },
        { status: 500 },
      )
    }

    const supabase = createClient(supabaseUrl, supabaseKey)

    // Check each table with a more reliable method
    const missingTables = []

    for (const tableName of tables) {
      try {
        // Use a simple count query which is more reliable than information_schema
        const { count, error } = await supabase.from(tableName).select("*", { count: "exact", head: true })

        // If there's an error with code 42P01, the table doesn't exist
        if (error && error.code === "42P01") {
          missingTables.push(tableName)
        }
      } catch (error: any) {
        console.warn(`Error checking table ${tableName}:`, error)
        // If we can't determine, assume it's missing to be safe
        if (error.code === "42P01" || error.message?.includes("does not exist")) {
          missingTables.push(tableName)
        }
      }
    }

    return NextResponse.json({ missingTables })
  } catch (error: any) {
    console.error("Unexpected error checking tables:", error)
    return NextResponse.json(
      {
        error: "Failed to check tables",
        details: error.message || String(error),
        code: "UNEXPECTED_ERROR",
        stack: process.env.NODE_ENV === "development" ? error.stack : undefined,
      },
      { status: 500 },
    )
  }
}
