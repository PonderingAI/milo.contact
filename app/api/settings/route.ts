import { createAdminClient } from "@/lib/supabase-server"
import { type NextRequest, NextResponse } from "next/server"

// GET handler to fetch all settings
export async function GET() {
  try {
    const supabase = createAdminClient()

    const { data, error } = await supabase.from("site_settings").select("key, value")

    if (error) {
      console.error("Error fetching settings:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data)
  } catch (error: any) {
    console.error("Error in GET /api/settings:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// POST handler to save settings
export async function POST(request: NextRequest) {
  try {
    const settingsArray = await request.json()

    if (!Array.isArray(settingsArray)) {
      return NextResponse.json({ error: "Invalid request format. Expected an array of settings." }, { status: 400 })
    }

    const supabase = createAdminClient()

    // Log the settings being saved for debugging
    console.log("Saving settings:", settingsArray)

    // Use upsert to insert or update settings
    const { error } = await supabase.from("site_settings").upsert(settingsArray, {
      onConflict: "key",
    })

    if (error) {
      console.error("Error saving settings:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, message: "Settings saved successfully" })
  } catch (error: any) {
    console.error("Error in POST /api/settings:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
