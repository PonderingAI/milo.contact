import { type NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase-server"

export async function GET(request: NextRequest) {
  try {
    const supabase = createAdminClient()

    const { data, error } = await supabase.from("site_settings").select("*")

    if (error) {
      console.error("Error fetching settings:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data)
  } catch (error: any) {
    console.error("Error in GET /api/settings:", error)
    return NextResponse.json({ error: error.message || "An unknown error occurred" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const settings = await request.json()

    if (!Array.isArray(settings)) {
      return NextResponse.json({ error: "Invalid settings format" }, { status: 400 })
    }

    const supabase = createAdminClient()

    // Process each setting
    for (const setting of settings) {
      const { key, value } = setting

      // Special handling for background_color to ensure it has a # prefix
      let processedValue = value
      if (key === "background_color" && value && !value.startsWith("#")) {
        processedValue = `#${value}`
      }

      // Upsert the setting
      const { error } = await supabase
        .from("site_settings")
        .upsert({ key, value: processedValue }, { onConflict: "key" })

      if (error) {
        console.error(`Error upserting setting ${key}:`, error)
        return NextResponse.json({ error: error.message }, { status: 500 })
      }
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error("Error in POST /api/settings:", error)
    return NextResponse.json({ error: error.message || "An unknown error occurred" }, { status: 500 })
  }
}
