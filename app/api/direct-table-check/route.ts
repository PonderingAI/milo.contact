import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { NextResponse } from "next/server"

export const dynamic = "force-dynamic"

export async function POST(request: Request) {
  try {
    // Parse the request body with error handling
    let requestData
    try {
      requestData = await request.json()
    } catch (error) {
      return NextResponse.json({ error: "Invalid JSON in request body" }, { status: 400 })
    }

    // Validate the tables parameter
    const { tables } = requestData || {}
    if (!tables || !Array.isArray(tables) || tables.length === 0) {
      return NextResponse.json({ error: "Tables array is required" }, { status: 400 })
    }

    console.log("Checking tables: ", tables)

    const supabase = createRouteHandlerClient({ cookies })

    // Check if each table exists
    const missingTables: string[] = []

    for (const tableName of tables) {
      try {
        // Use a simple query to check if the table exists
        const { error } = await supabase.from(tableName).select("*").limit(1)

        if (error && (error.code === "PGRST116" || error.message?.includes("does not exist"))) {
          // PGRST116 is the error code for "relation does not exist"
          missingTables.push(tableName)
        }
      } catch (error) {
        console.error(`Error checking table ${tableName}:`, error)
        // If we can't check, assume it's missing
        missingTables.push(tableName)
      }
    }

    return NextResponse.json({
      missingTables,
      allTablesExist: missingTables.length === 0,
    })
  } catch (error) {
    console.error("Error in direct-table-check:", error)
    return NextResponse.json(
      {
        error: "Unknown error checking tables",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    )
  }
}
