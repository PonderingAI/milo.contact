import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

export async function GET() {
  try {
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

    // If table doesn't exist, return default settings
    if (!tableExists) {
      return NextResponse.json({
        updateMode: "manual",
        autoUpdateSchedule: "weekly",
        notifyOnUpdates: true,
      })
    }

    // Get all settings
    const { data: settings, error: settingsError } = await supabase.from("dependency_settings").select("*")

    if (settingsError) {
      console.error("Error fetching settings:", settingsError)
      return NextResponse.json({ error: "Failed to fetch settings", details: settingsError.message }, { status: 500 })
    }

    // Convert settings array to object
    const settingsObject: Record<string, string> = {}
    settings?.forEach((setting) => {
      settingsObject[setting.key] = setting.value
    })

    // Return settings with defaults for missing values
    return NextResponse.json({
      updateMode: settingsObject.update_mode || "manual",
      autoUpdateSchedule: settingsObject.auto_update_schedule || "weekly",
      notifyOnUpdates: settingsObject.notify_on_updates === "true",
    })
  } catch (error) {
    console.error("Error in settings:", error)
    return NextResponse.json({ error: "Internal server error", details: (error as Error).message }, { status: 500 })
  }
}
