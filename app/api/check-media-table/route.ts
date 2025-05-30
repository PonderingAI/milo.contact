import { createClient } from "@/lib/supabase-server"
import { NextResponse } from "next/server"

export async function GET() {
  try {
    const supabase = createClient()

    // Try to query the media table
    const { data, error } = await supabase.from("media").select("id").limit(1).maybeSingle()

    // If we get a PGRST116 error, the table doesn't exist
    if (error && error.code === "PGRST116") {
      return NextResponse.json({ exists: false })
    }

    // If we get here, the table exists
    return NextResponse.json({ exists: true })
  } catch (error) {
    console.error("Error checking media table:", error)
    return NextResponse.json({ exists: false, error: "Failed to check media table" })
  }
}
