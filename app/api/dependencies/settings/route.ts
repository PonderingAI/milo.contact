import { NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase-server"

export async function POST(request: Request) {
  try {
    const { autoUpdateEnabled, conservativeMode } = await request.json()
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
          auto_update_enabled BOOLEAN DEFAULT false,
          conservative_mode BOOLEAN DEFAULT true,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
        
        -- Insert default settings
        INSERT INTO dependency_settings (auto_update_enabled, conservative_mode)
        VALUES (false, true)
        ON CONFLICT DO NOTHING;
      `

      const { error: createError } = await supabase.rpc("run_sql", { sql: createTableQuery })

      if (createError) {
        console.error("Error creating dependency_settings table:", createError)
        return NextResponse.json({ error: "Failed to create dependency_settings table" }, { status: 500 })
      }
    }

    // Update settings
    const { error: updateError } = await supabase
      .from("dependency_settings")
      .update({
        auto_update_enabled: autoUpdateEnabled,
        conservative_mode: conservativeMode,
        updated_at: new Date().toISOString(),
      })
      .eq("id", 1)

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
