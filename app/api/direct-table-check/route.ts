import { NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase-server"

// Add CORS headers to all responses
function addCorsHeaders(response: NextResponse) {
  response.headers.set("Access-Control-Allow-Origin", "*")
  response.headers.set("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
  response.headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization")
  return response
}

// Handle OPTIONS requests for CORS preflight
export async function OPTIONS() {
  return addCorsHeaders(NextResponse.json({}, { status: 200 }))
}

export async function POST(request: Request) {
  try {
    // Parse the request body
    let tables: string[] = []
    try {
      const body = await request.json()
      tables = body.tables || []
    } catch (e) {
      console.error("Error parsing request body:", e)
      return addCorsHeaders(
        NextResponse.json(
          {
            error: "Invalid request body",
            missingTables: [],
            existingTables: [],
            checkedTables: [],
          },
          { status: 400 },
        ),
      )
    }

    if (!Array.isArray(tables) || tables.length === 0) {
      return addCorsHeaders(
        NextResponse.json(
          {
            error: "Invalid request: tables must be a non-empty array",
            missingTables: [],
            existingTables: [],
            checkedTables: [],
          },
          { status: 400 },
        ),
      )
    }

    console.log("Checking tables:", tables)

    // Create a Supabase client
    let supabase
    try {
      supabase = createAdminClient()
    } catch (e) {
      console.error("Error creating Supabase client:", e)
      return addCorsHeaders(
        NextResponse.json(
          {
            error: "Failed to create database client",
            missingTables: tables, // Assume all tables are missing
            existingTables: [],
            checkedTables: tables,
          },
          { status: 500 },
        ),
      )
    }

    // Method 1: Direct SQL query to information_schema
    try {
      const { data, error } = await supabase.rpc("check_tables_exist", {
        table_names: tables,
      })

      if (error) {
        console.warn("RPC method failed:", error)
        throw new Error("RPC method failed")
      }

      if (data) {
        const existingTables = data.filter((t) => t.exists).map((t) => t.table_name)
        const missingTables = data.filter((t) => !t.exists).map((t) => t.table_name)

        console.log("Tables check complete via RPC:", { existingTables, missingTables })

        return addCorsHeaders(
          NextResponse.json({
            missingTables,
            existingTables,
            checkedTables: tables,
          }),
        )
      }
    } catch (e) {
      console.warn("Method 1 failed, trying method 2:", e)
    }

    // Method 2: Query information_schema directly
    try {
      const { data, error } = await supabase
        .from("information_schema.tables")
        .select("table_name")
        .eq("table_schema", "public")
        .in("table_type", ["BASE TABLE", "VIEW"])

      if (error) {
        console.warn("Method 2 failed:", error)
        throw new Error("Method 2 failed")
      }

      if (data) {
        const existingTableSet = new Set(data.map((t) => t.table_name))
        const existingTables = tables.filter((t) => existingTableSet.has(t))
        const missingTables = tables.filter((t) => !existingTableSet.has(t))

        console.log("Tables check complete via information_schema:", { existingTables, missingTables })

        return addCorsHeaders(
          NextResponse.json({
            missingTables,
            existingTables,
            checkedTables: tables,
          }),
        )
      }
    } catch (e) {
      console.warn("Method 2 failed, trying method 3:", e)
    }

    // Method 3: Try to query each table directly
    try {
      const existingTables: string[] = []
      const missingTables: string[] = []

      for (const tableName of tables) {
        try {
          const { count, error } = await supabase.from(tableName).select("*", { count: "exact", head: true })

          if (error) {
            if (error.message.includes("relation") && error.message.includes("does not exist")) {
              missingTables.push(tableName)
            } else {
              console.warn(`Unexpected error for table ${tableName}:`, error)
              missingTables.push(tableName) // Assume missing on any error
            }
          } else {
            existingTables.push(tableName)
          }
        } catch (e) {
          console.warn(`Error checking table ${tableName}:`, e)
          missingTables.push(tableName) // Assume missing on any error
        }
      }

      console.log("Tables check complete via direct query:", { existingTables, missingTables })

      return addCorsHeaders(
        NextResponse.json({
          missingTables,
          existingTables,
          checkedTables: tables,
        }),
      )
    } catch (e) {
      console.warn("Method 3 failed, using fallback:", e)
    }

    // Fallback: Return all tables as missing
    console.log("All methods failed, returning all tables as missing")
    return addCorsHeaders(
      NextResponse.json({
        missingTables: tables,
        existingTables: [],
        checkedTables: tables,
        warning: "Could not verify table existence. All tables are shown as missing.",
      }),
    )
  } catch (error) {
    console.error("Unhandled error in direct-table-check:", error)
    return addCorsHeaders(
      NextResponse.json(
        {
          error: error instanceof Error ? error.message : "Unknown error",
          missingTables: [], // Return empty arrays to prevent UI errors
          existingTables: [],
          checkedTables: [],
        },
        { status: 500 },
      ),
    )
  }
}
