import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase-server"

export async function POST(request: Request) {
  try {
    const { userId, mode } = await request.json()

    if (!userId || !mode) {
      return NextResponse.json({ error: "User ID and mode are required" }, { status: 400 })
    }

    const validModes = ["manual", "prompt", "auto-minor", "auto-all"]
    if (!validModes.includes(mode)) {
      return NextResponse.json({ error: "Invalid mode" }, { status: 400 })
    }

    const supabase = createClient()

    // Check if user_preferences table exists
    const { data: tableExists, error: tableCheckError } = await supabase.from("user_preferences").select("id").limit(1)

    if (tableCheckError && tableCheckError.code !== "PGRST116") {
      // Create the table if it doesn't exist
      await supabase.rpc("create_user_preferences_table")
    }

    // Check if preferences already exist for this user
    const { data: existingPrefs, error: fetchError } = await supabase
      .from("user_preferences")
      .select("id")
      .eq("user_id", userId)
      .single()

    if (fetchError && fetchError.code !== "PGRST116") {
      console.error("Error fetching user preferences:", fetchError)
      return NextResponse.json({ error: "Failed to fetch user preferences" }, { status: 500 })
    }

    if (existingPrefs) {
      // Update existing preferences
      const { error: updateError } = await supabase
        .from("user_preferences")
        .update({ update_mode: mode, updated_at: new Date().toISOString() })
        .eq("id", existingPrefs.id)

      if (updateError) {
        console.error("Error updating user preferences:", updateError)
        return NextResponse.json({ error: "Failed to update user preferences" }, { status: 500 })
      }
    } else {
      // Insert new preferences
      const { error: insertError } = await supabase.from("user_preferences").insert([
        {
          user_id: userId,
          update_mode: mode,
        },
      ])

      if (insertError) {
        console.error("Error inserting user preferences:", insertError)
        return NextResponse.json({ error: "Failed to insert user preferences" }, { status: 500 })
      }
    }

    return NextResponse.json({ success: true, mode })
  } catch (error) {
    console.error("Error updating update mode:", error)
    return NextResponse.json({ error: "Failed to update update mode" }, { status: 500 })
  }
}
