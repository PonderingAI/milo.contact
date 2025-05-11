import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase-server"

export async function GET(request: Request) {
  try {
    const supabase = createClient()
    const url = new URL(request.url)
    const key = url.searchParams.get("key")

    if (!key) {
      return NextResponse.json({ error: "Key parameter is required" }, { status: 400 })
    }

    // Check if settings table exists
    const { error: tableError } = await supabase.from("dependency_settings").select("*").limit(1)

    if (tableError) {
      console.error("Error checking dependency_settings table:", tableError)
      return NextResponse.json({ error: "Settings table does not exist" }, { status: 500 })
    }

    // Get setting by key
    const { data, error } = await supabase.from("dependency_settings").select("value").eq("key", key).single()

    if (error && error.code !== "PGRST116") {
      console.error(`Error fetching setting ${key}:`, error)
      return NextResponse.json({ error: "Failed to fetch setting" }, { status: 500 })
    }

    return NextResponse.json(data || { value: null })
  } catch (error) {
    console.error("Error in settings route:", error)
    return NextResponse.json({ error: "Failed to fetch setting" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const supabase = createClient()
    const body = await request.json()
    const { key, value } = body

    if (!key || value === undefined) {
      return NextResponse.json({ error: "Key and value are required" }, { status: 400 })
    }

    // Check if settings table exists
    const { error: tableError } = await supabase.from("dependency_settings").select("*").limit(1)

    if (tableError) {
      console.error("Error checking dependency_settings table:", tableError)
      return NextResponse.json({ error: "Settings table does not exist" }, { status: 500 })
    }

    // Save setting
    const { error } = await supabase.from("dependency_settings").upsert(
      {
        key,
        value,
      },
      {
        onConflict: "key",
      },
    )

    if (error) {
      console.error("Error saving setting:", error)
      return NextResponse.json({ error: "Failed to save setting" }, { status: 500 })
    }

    return NextResponse.json({ success: true, key, value })
  } catch (error) {
    console.error("Error in settings route:", error)
    return NextResponse.json({ error: "Failed to save setting" }, { status: 500 })
  }
}
