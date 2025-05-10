import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase-server"
import { auth } from "@clerk/nextjs/server"

export async function POST(request: Request) {
  try {
    // Check authentication
    const { userId } = auth()
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

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

    // Connect to Supabase
    const supabase = createClient()

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
