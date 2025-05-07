import { NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase-server"

export async function POST(request: Request) {
  try {
    const { update_mode, auto_update_enabled, update_schedule } = await request.json()
    const supabase = createAdminClient()

    // Check if settings table exists
    const { data: tableExists, error: checkError } = await supabase.rpc("check_table_exists", {
      table_name: "dependency_settings",
    })

    if (checkError) {
      console.error("Error checking if dependency_settings table exists:", checkError)
      return NextResponse.json({ error: "Failed to check if dependency_settings table exists" }, { status: 500 })
    }

    // Create table if it doesn't exist
    if (!tableExists) {
      const createTableQuery = `
        CREATE TABLE IF NOT EXISTS dependency_settings (
          id SERIAL PRIMARY KEY,
          update_mode VARCHAR(50) DEFAULT 'conservative',
          auto_update_enabled BOOLEAN DEFAULT false,
          update_schedule VARCHAR(100) DEFAULT 'daily',
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
        
        -- Insert default settings
        INSERT INTO dependency_settings (update_mode, auto_update_enabled, update_schedule)
        VALUES ('conservative', false, 'daily')
        ON CONFLICT DO NOTHING;
      `

      const { error: createError } = await supabase.rpc("run_sql", { sql: createTableQuery })

      if (createError) {
        console.error("Error creating dependency_settings table:", createError)
        return NextResponse.json({ error: "Failed to create dependency_settings table" }, { status: 500 })
      }
    }

    // Update settings
    const updateData: any = {}
    if (update_mode !== undefined) updateData.update_mode = update_mode
    if (auto_update_enabled !== undefined) updateData.auto_update_enabled = auto_update_enabled
    if (update_schedule !== undefined) updateData.update_schedule = update_schedule
    updateData.updated_at = new Date().toISOString()

    const { error: updateError } = await supabase.from("dependency_settings").update(updateData).eq("id", 1)

    if (updateError) {
      console.error("Error updating dependency settings:", updateError)
      return NextResponse.json({ error: "Failed to update dependency settings" }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error in dependency settings API:", error)
    return NextResponse.json({ error: "Failed to update dependency settings" }, { status: 500 })
  }
}

export async function GET() {
  try {
    const supabase = createAdminClient()

    // Check if settings table exists
    const { data: tableExists, error: checkError } = await supabase.rpc("check_table_exists", {
      table_name: "dependency_settings",
    })

    if (checkError) {
      console.error("Error checking if dependency_settings table exists:", checkError)
      return NextResponse.json({ error: "Failed to check if dependency_settings table exists" }, { status: 500 })
    }

    // If table doesn't exist, return default settings
    if (!tableExists) {
      return NextResponse.json({
        settings: {
          update_mode: "conservative",
          auto_update_enabled: false,
          update_schedule: "daily",
        },
        tableExists: false,
      })
    }

    // Get settings
    const { data: settings, error: fetchError } = await supabase
      .from("dependency_settings")
      .select("*")
      .limit(1)
      .single()

    if (fetchError) {
      console.error("Error fetching dependency settings:", fetchError)
      return NextResponse.json({ error: "Failed to fetch dependency settings" }, { status: 500 })
    }

    return NextResponse.json({
      settings,
      tableExists: true,
    })
  } catch (error) {
    console.error("Error in dependency settings API:", error)
    return NextResponse.json({ error: "Failed to fetch dependency settings" }, { status: 500 })
  }
}
