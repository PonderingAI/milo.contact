import { NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase-server"

export async function POST(request: Request) {
  try {
    // Parse request body
    const body = await request.json()
    const { id, updateMode } = body

    if (!id || !updateMode) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Valid update modes
    const validModes = ["off", "conservative", "aggressive", "global"]
    if (!validModes.includes(updateMode)) {
      return NextResponse.json({ error: "Invalid update mode" }, { status: 400 })
    }

    // Connect to Supabase using admin client
    const supabase = createAdminClient()

    // Update the dependency
    const { error } = await supabase.from("dependencies").update({ update_mode: updateMode }).eq("id", id)

    if (error) {
      console.error("Error updating dependency mode:", error)
      return NextResponse.json({ error: "Failed to update dependency mode" }, { status: 500 })
    }

    return NextResponse.json({ success: true, message: "Dependency mode updated successfully" })
  } catch (error) {
    console.error("Error in update-mode API:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
