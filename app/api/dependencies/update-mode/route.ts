import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase-server"

export async function POST(request: Request) {
  try {
    const supabase = createClient()
    const body = await request.json()
    const { mode } = body

    if (!mode) {
      return NextResponse.json({ error: "Update mode is required" }, { status: 400 })
    }

    // Validate mode
    const validModes = ["manual", "auto", "scheduled", "prompt"]
    if (!validModes.includes(mode)) {
      return NextResponse.json({ error: "Invalid update mode" }, { status: 400 })
    }

    // Check if settings table exists
    const { error: tableError } = await supabase.from("dependency_settings").select("*").limit(1)

    if (tableError) {
      console.error("Error checking dependency_settings table:", tableError)
      return NextResponse.json({ error: "Settings table does not exist" }, { status: 500 })
    }

    // Save update mode to the database
    const { error } = await supabase.from("dependency_settings").upsert(
      {
        key: "update_mode",
        value: mode,
      },
      {
        onConflict: "key",
      },
    )

    if (error) {
      console.error("Error saving update mode:", error)
      return NextResponse.json({ error: "Failed to save update mode" }, { status: 500 })
    }

    return NextResponse.json({ success: true, mode })
  } catch (error) {
    console.error("Error in update-mode:", error)
    return NextResponse.json({ error: "Failed to update mode" }, { status: 500 })
  }
}
