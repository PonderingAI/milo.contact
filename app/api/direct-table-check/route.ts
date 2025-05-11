import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

export async function POST(request: Request) {
  try {
    // Get the request body
    const body = await request.json()

    // Validate the request body
    if (!body || !body.tableName) {
      return NextResponse.json({ error: "Missing required parameter: tableName" }, { status: 400 })
    }

    const { tableName } = body

    // Create Supabase client
    const supabaseUrl = process.env.SUPABASE_URL
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json({ error: "Missing Supabase credentials" }, { status: 500 })
    }

    const supabase = createClient(supabaseUrl, supabaseKey)

    // Check if the table exists
    const { data, error } = await supabase
      .from("information_schema.tables")
      .select("table_name")
      .eq("table_schema", "public")
      .eq("table_name", tableName)
      .single()

    if (error) {
      console.error("Error checking table:", error)
      return NextResponse.json({ error: "Failed to check table", details: error.message }, { status: 500 })
    }

    return NextResponse.json({
      exists: !!data,
      tableName,
    })
  } catch (error) {
    console.error("Error in direct-table-check:", error)
    return NextResponse.json({ error: "Internal server error", details: (error as Error).message }, { status: 500 })
  }
}
