import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { NextResponse } from "next/server"

export const dynamic = "force-dynamic"

export async function POST(request: Request) {
  try {
    const requestData = await request.json()
    const { tables } = requestData

    if (!tables || !Array.isArray(tables)) {
      return NextResponse.json({ error: "Invalid tables parameter" }, { status: 400 })
    }

    const supabase = createRouteHandlerClient({ cookies })

    // Check if each table exists
    const missingTables: string[] = []

    for (const tableName of tables) {
      try {
        // Use a simple query to check if the table exists
        const { error } = await supabase.from(tableName).select("*").limit(1)

        if (error && error.code === "PGRST116") {
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
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
