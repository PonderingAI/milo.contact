import { NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase-server"

export async function POST(request: Request) {
  try {
    // Parse the request body
    const body = await request.json()
    const tables = body.tables || []

    // Create a Supabase client
    const supabase = createAdminClient()

    // Use a simple approach: check if each table exists by querying it directly
    const existingTables: string[] = []
    const missingTables: string[] = []

    // For each table, try a simple query
    for (const tableName of tables) {
      try {
        // Simple query to check if table exists
        const { error } = await supabase.from(tableName).select("*", { count: "exact", head: true })

        if (error && error.message.includes("does not exist")) {
          missingTables.push(tableName)
        } else {
          existingTables.push(tableName)
        }
      } catch (e) {
        // If any error occurs, assume the table doesn't exist
        missingTables.push(tableName)
      }
    }

    // Return the results
    return NextResponse.json({
      missingTables,
      existingTables,
      checkedTables: tables,
    })
  } catch (error) {
    console.error("Error in direct-table-check:", error)
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Unknown error",
        missingTables: [],
        existingTables: [],
        checkedTables: [],
      },
      { status: 500 },
    )
  }
}
