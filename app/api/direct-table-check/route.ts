import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

export async function POST(request: Request) {
  try {
    // Get the request body
    let body
    try {
      body = await request.json()
    } catch (error) {
      console.error("Error parsing request body:", error)
      return NextResponse.json({ error: "Invalid JSON in request body" }, { status: 400 })
    }

    // Validate the request body
    if (!body || (!body.tableName && !body.tables)) {
      return NextResponse.json(
        {
          error: "Missing required parameter: either 'tableName' or 'tables' array is required",
        },
        { status: 400 },
      )
    }

    // Create Supabase client
    const supabaseUrl = process.env.SUPABASE_URL
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json({ error: "Missing Supabase credentials" }, { status: 500 })
    }

    const supabase = createClient(supabaseUrl, supabaseKey)

    // Handle single table check
    if (body.tableName) {
      const { data, error } = await supabase
        .from("information_schema.tables")
        .select("table_name")
        .eq("table_schema", "public")
        .eq("table_name", body.tableName)
        .single()

      if (error && !error.message.includes("No rows found")) {
        console.error("Error checking table:", error)
        return NextResponse.json({ error: "Failed to check table", details: error.message }, { status: 500 })
      }

      return NextResponse.json({
        exists: !!data,
        tableName: body.tableName,
      })
    }

    // Handle multiple tables check
    if (Array.isArray(body.tables)) {
      const { data, error } = await supabase
        .from("information_schema.tables")
        .select("table_name")
        .eq("table_schema", "public")
        .in("table_name", body.tables)

      if (error) {
        console.error("Error checking tables:", error)
        return NextResponse.json({ error: "Failed to check tables", details: error.message }, { status: 500 })
      }

      const existingTables = data?.map((row) => row.table_name) || []
      const missingTables = body.tables.filter((table) => !existingTables.includes(table))

      return NextResponse.json({
        existingTables,
        missingTables,
        allExist: missingTables.length === 0,
        checkedTables: body.tables,
      })
    }

    return NextResponse.json({ error: "Invalid request format" }, { status: 400 })
  } catch (error) {
    console.error("Error in direct-table-check:", error)
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    )
  }
}
