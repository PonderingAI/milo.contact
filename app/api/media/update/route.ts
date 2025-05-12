import { createAdminClient } from "@/lib/supabase-server"
import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    const { id, filename, tags } = await request.json()

    if (!id) {
      return NextResponse.json({ error: "Media ID is required" }, { status: 400 })
    }

    if (!filename || !filename.trim()) {
      return NextResponse.json({ error: "Filename cannot be empty" }, { status: 400 })
    }

    const supabase = createAdminClient()

    // Update the media item
    const { data, error } = await supabase
      .from("media")
      .update({
        filename,
        tags: Array.isArray(tags) ? tags : [],
      })
      .eq("id", id)
      .select()

    if (error) {
      console.error("Database update error:", error)
      return NextResponse.json({ error: `Failed to update media: ${error.message}` }, { status: 500 })
    }

    // Verify the update was successful
    const { data: verifyData, error: verifyError } = await supabase.from("media").select("*").eq("id", id).single()

    if (verifyError) {
      console.error("Error verifying update:", verifyError)
      return NextResponse.json({ error: `Failed to verify update: ${verifyError.message}` }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: "Media updated successfully",
      data: verifyData,
    })
  } catch (error) {
    console.error("Error in media update API:", error)
    return NextResponse.json(
      { error: `Failed to update media: ${error instanceof Error ? error.message : String(error)}` },
      { status: 500 },
    )
  }
}
