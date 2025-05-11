import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

export async function POST(request: Request) {
  try {
    // Get the request body
    const body = await request.json()

    // Validate the request body
    if (!body || !body.mode) {
      return NextResponse.json({ error: "Missing required parameter: mode" }, { status: 400 })
    }

    const { mode } = body

    // Validate the mode value
    const validModes = ["manual", "prompt", "auto-minor", "auto-all"]
    if (!validModes.includes(mode)) {
      return NextResponse.json(
        { error: "Invalid mode value. Must be one of: " + validModes.join(", ") },
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

    // Check if the dependency_settings table exists
    const { data: tableExists, error: tableCheckError } = await supabase
      .from("information_schema.tables")
      .select("table_name")
      .eq("table_schema", "public")
      .eq("table_name", "dependency_settings")
      .single()

    if (tableCheckError && !tableCheckError.message.includes("No rows found")) {
      console.error("Error checking table:", tableCheckError)
      return NextResponse.json({ error: "Failed to check table", details: tableCheckError.message }, { status: 500 })
    }

    // Create the table if it doesn't exist
    if (!tableExists) {
      const { error: createTableError } = await supabase.rpc("execute_sql", {
        sql_query: `
          CREATE TABLE IF NOT EXISTS dependency_settings (
            id SERIAL PRIMARY KEY,
            key TEXT NOT NULL UNIQUE,
            value TEXT NOT NULL,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
          );
        `,
      })

      if (createTableError) {
        console.error("Error creating table:", createTableError)
        return NextResponse.json(
          { error: "Failed to create table", details: createTableError.message },
          { status: 500 },
        )
      }
    }

    // Check if the setting already exists
    const { data: existingSetting, error: settingCheckError } = await supabase
      .from("dependency_settings")
      .select("*")
      .eq("key", "update_mode")
      .single()

    if (settingCheckError && !settingCheckError.message.includes("No rows found")) {
      console.error("Error checking setting:", settingCheckError)
      return NextResponse.json(
        { error: "Failed to check setting", details: settingCheckError.message },
        { status: 500 },
      )
    }

    let result

    // Update or insert the setting
    if (existingSetting) {
      // Update existing setting
      const { data, error } = await supabase
        .from("dependency_settings")
        .update({
          value: mode,
          updated_at: new Date().toISOString(),
        })
        .eq("key", "update_mode")
        .select()

      if (error) {
        console.error("Error updating setting:", error)
        return NextResponse.json({ error: "Failed to update setting", details: error.message }, { status: 500 })
      }

      result = data
    } else {
      // Insert new setting
      const { data, error } = await supabase
        .from("dependency_settings")
        .insert({
          key: "update_mode",
          value: mode,
        })
        .select()

      if (error) {
        console.error("Error inserting setting:", error)
        return NextResponse.json({ error: "Failed to insert setting", details: error.message }, { status: 500 })
      }

      result = data
    }

    return NextResponse.json({
      success: true,
      updateMode: mode,
      data: result,
    })
  } catch (error) {
    console.error("Error in update-mode:", error)
    return NextResponse.json({ error: "Internal server error", details: (error as Error).message }, { status: 500 })
  }
}
