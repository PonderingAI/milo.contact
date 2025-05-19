import { createServerClient } from "@/lib/supabase"
import { NextResponse } from "next/server"

export async function POST() {
  try {
    const supabase = createServerClient()

    // Create media bucket if it doesn't exist
    const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets()

    if (bucketsError) {
      return NextResponse.json(
        { success: false, message: `Error listing buckets: ${bucketsError.message}` },
        { status: 500 },
      )
    }

    const mediaBucket = buckets?.find((bucket) => bucket.name === "media")

    if (!mediaBucket) {
      // Create the media bucket
      const { error: createError } = await supabase.storage.createBucket("media", {
        public: true,
        fileSizeLimit: 5242880, // 5MB
      })

      if (createError) {
        return NextResponse.json(
          { success: false, message: `Error creating media bucket: ${createError.message}` },
          { status: 500 },
        )
      }
    }

    // Create folders in the media bucket
    const folders = ["projects", "bts-images"]

    for (const folder of folders) {
      // Create an empty file to ensure the folder exists
      const { error: folderError } = await supabase.storage.from("media").upload(`${folder}/.keep`, new Blob([""]), {
        upsert: true,
      })

      if (folderError && folderError.message !== "The resource already exists") {
        return NextResponse.json(
          { success: false, message: `Error creating folder ${folder}: ${folderError.message}` },
          { status: 500 },
        )
      }
    }

    return NextResponse.json({ success: true, message: "Storage setup completed successfully" })
  } catch (error) {
    console.error("Error setting up storage:", error)
    return NextResponse.json(
      {
        success: false,
        message: `Error setting up storage: ${error instanceof Error ? error.message : String(error)}`,
      },
      { status: 500 },
    )
  }
}
