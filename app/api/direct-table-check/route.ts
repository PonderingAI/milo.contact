import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

export async function POST(request: Request) {
  try {
    const { tables } = await request.json()

    if (!tables || !Array.isArray(tables)) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid request: tables must be an array",
        },
        { status: 400 },
      )
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

    // Check each table
    const results: Record<string, boolean> = {}
    const existingTables: string[] = []
    const missingTables: string[] = []

    for (const table of tables) {
      try {
        // Try to select a single row from the table
        const { data, error } = await supabase.from(table).select("*").limit(1)

        // If there's no error, the table exists
        if (!error) {
          results[table] = true
          existingTables.push(table)
        } else {
          // Check if the error is because the table doesn't exist
          if (error.message.includes("does not exist") || error.code === "42P01") {
            results[table] = false
            missingTables.push(table)
          } else {
            // For other errors, try a different approach
            try {
              const { data: pgData, error: pgError } = await supabase
                .from("pg_catalog.pg_tables")
                .select("tablename")
                .eq("schemaname", "public")
                .eq("tablename", table)
                .limit(1)

              if (!pgError && pgData && pgData.length > 0) {
                results[table] = true
                existingTables.push(table)
              } else {
                results[table] = false
                missingTables.push(table)
              }
            } catch (innerError) {
              console.error(`Alternative check for table ${table} failed:`, innerError)
              results[table] = false
              missingTables.push(table)
            }
          }
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
    console.error("Error in direct-table-check:", error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
