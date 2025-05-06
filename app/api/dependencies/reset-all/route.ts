import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

// Create a Supabase client with the service role key
const supabaseAdmin = createClient(process.env.SUPABASE_URL || "", process.env.SUPABASE_SERVICE_ROLE_KEY || "")

export async function POST() {
  try {
    // Reset all dependencies to use the "global" setting
    const { error } = await supabaseAdmin.from("dependencies").update({ update_mode: "global" }).neq("id", 0) // Update all records

    if (error) throw error

    return NextResponse.json({ success: true, message: "All dependencies reset to global setting" })
  } catch (error) {
    console.error("Error resetting dependencies:", error)
    return NextResponse.json(
      { error: "Failed to reset dependencies", details: error instanceof Error ? error.message : String(error) },
      { status: 500 },
    )
  }
}
