import { createAdminClient } from "@/lib/supabase-server"
import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    const { id, filepath, filetype } = await request.json()

    if (!id) {
      return NextResponse.json({ error: "Media ID is required" }, { status: 400 })
    }

    const supabase = createAdminClient()

    // First delete from database
    const { error: dbError } = await supabase.from("media").delete().eq("id", id)

    if (dbError) {
      console.error("Database deletion error:", dbError)
      return NextResponse.json({ error: `Failed to delete from database: ${dbError.message}` }, { status: 500 })
    }

    // Then try to delete from storage if it's not an external URL
    let storageResult = { success: true, message: "No storage deletion needed" }

    if (!filepath.startsWith("http") && filetype !== "vimeo" && filetype !== "youtube" && filetype !== "linkedin") {
      try {
        const { error: storageError } = await supabase.storage.from("media").remove([filepath])

        if (storageError) {
          console.warn("Storage deletion warning:", storageError)
          storageResult = {
            success: false,
            message: `Storage deletion warning: ${storageError.message} (DB record was deleted)`,
          }
        } else {
          storageResult = { success: true, message: "Storage file deleted successfully" }
        }
      } catch (storageErr) {
        console.warn("Storage deletion exception:", storageErr)
        storageResult = {
          success: false,
          message: `Storage deletion exception: ${storageErr instanceof Error ? storageErr.message : String(storageErr)} (DB record was deleted)`,
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: "Media deleted successfully",
      dbResult: { success: true },
      storageResult,
    })
  } catch (error) {
    console.error("Error in media delete API:", error)
    return NextResponse.json(
      { error: `Failed to delete media: ${error instanceof Error ? error.message : String(error)}` },
      { status: 500 },
    )
  }
}
