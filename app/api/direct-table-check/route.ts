import { NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase-server"

export async function POST(request: Request) {
  try {
    const { tables } = await request.json()

    if (!Array.isArray(tables) || tables.length === 0) {
      return NextResponse.json(
        {
          error: "Invalid request: tables must be a non-empty array",
        },
        { status: 400 },
      )
    }

    console.log("Checking tables:", tables)

    const supabase = createAdminClient()

    // First try: Use a simpler query that's less likely to fail
    try {
      // Query if each table exists individually to avoid complex queries
      const existingTables = []
      const missingTables = []

      for (const tableName of tables) {
        // Use a simple count query to check if the table exists
        const { count, error } = await supabase.from(tableName).select("*", { count: "exact", head: true })

        if (error) {
          // If we get an error like "relation does not exist", the table is missing
          if (error.message.includes("relation") && error.message.includes("does not exist")) {
            missingTables.push(tableName)
          } else {
            console.warn(`Error checking table ${tableName}:`, error)
            // If it's another type of error, we'll try the fallback method
            throw new Error("Using fallback method")
          }
        } else {
          existingTables.push(tableName)
        }
      }

      console.log("Check complete:", { existingTables, missingTables })

      return NextResponse.json({
        missingTables,
        existingTables,
        allExist: missingTables.length === 0,
        checkedTables: tables,
      })
    } catch (error) {
      console.log("First method failed, trying fallback method:", error)
      // Continue to fallback method
    }

    // Fallback method: Try to query the information schema
    try {
      const { data, error } = await supabase.rpc("check_tables_exist", {
        table_names: tables,
      })

      if (error) {
        throw error
      }

      const existingTables = data.filter((t) => t.exists).map((t) => t.table_name)
      const missingTables = data.filter((t) => !t.exists).map((t) => t.table_name)

      console.log("Fallback check complete:", { existingTables, missingTables })

      return NextResponse.json({
        missingTables,
        existingTables,
        allExist: missingTables.length === 0,
        checkedTables: tables,
      })
    } catch (error) {
      console.log("Fallback method failed, using last resort method:", error)
      // Continue to last resort method
    }

    // Last resort: Return all tables as missing so the user can decide
    console.log("Using last resort method - returning all tables as missing")
    return NextResponse.json({
      missingTables: tables,
      existingTables: [],
      allExist: false,
      checkedTables: tables,
      warning: "Could not verify table existence. All tables are shown as missing.",
    })
  } catch (error) {
    console.error("Error in direct-table-check:", error)
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Unknown error",
        missingTables: [], // Return empty arrays to prevent UI errors
        existingTables: [],
        checkedTables: [],
      },
      { status: 500 },
    )
  }
}
