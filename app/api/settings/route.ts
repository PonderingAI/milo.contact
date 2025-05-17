import { NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase-server"

export async function GET(request: Request) {
  try {
    const supabase = createAdminClient()
    const { data, error } = await supabase.from("settings").select("*")

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    const settingsObject: Record<string, any> = {}
    data.forEach((setting) => {
      settingsObject[setting.key] = setting.value
    })

    return NextResponse.json(settingsObject)
  } catch (error) {
    console.error("Error getting settings:", error)
    return NextResponse.json({ error: "An unexpected error occurred while retrieving settings" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const reqData = await request.json()
    const supabase = createAdminClient()

    // Validate that we received key-value settings
    if (!reqData || typeof reqData !== "object") {
      return NextResponse.json({ error: "Invalid settings data" }, { status: 400 })
    }

    console.log("Settings to update:", reqData)

    // Batch insert/update the settings
    const updates = Object.entries(reqData).map(([key, value]) => ({
      key,
      value,
    }))

    const { error } = await supabase.from("settings").upsert(updates, {
      onConflict: "key",
    })

    if (error) {
      console.error("Error updating settings:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, message: "Settings updated successfully" })
  } catch (error) {
    console.error("Error updating settings:", error)
    return NextResponse.json({ error: "An unexpected error occurred while updating settings" }, { status: 500 })
  }
}
