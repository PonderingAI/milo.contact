import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase-server"
import type { WidgetLayout } from "@/lib/grid-utils"

export async function POST(request: Request) {
  try {
    const supabase = createClient()
    const body = await request.json()
    const { layouts } = body as { layouts: WidgetLayout[] }

    if (!layouts) {
      return NextResponse.json({ error: "Layouts are required" }, { status: 400 })
    }

    // Check if settings table exists
    const { error: tableError } = await supabase.from("dependency_settings").select("*").limit(1)

    if (tableError) {
      console.error("Error checking dependency_settings table:", tableError)
      return NextResponse.json({ error: "Settings table does not exist" }, { status: 500 })
    }

    // Save layouts to the database
    const { error } = await supabase.from("dependency_settings").upsert(
      {
        key: "widget_layouts",
        value: layouts,
      },
      {
        onConflict: "key",
      },
    )

    if (error) {
      console.error("Error saving layouts:", error)
      return NextResponse.json({ error: "Failed to save layouts" }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error in save-layouts:", error)
    return NextResponse.json({ error: "Failed to save layouts" }, { status: 500 })
  }
}
