import { createServerClient } from "@/lib/supabase"
import { NextResponse } from "next/server"

export async function POST() {
  try {
    const supabase = createServerClient()

    // Check if bucket exists
    const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets()

    if (bucketsError) {
      return NextResponse.json(
        { success: false, message: `Error listing buckets: ${bucketsError.message}` },
        { status: 500 },
      )
    }

    // Look for the public bucket
    const publicBucket = buckets?.find((bucket) => bucket.name === "public")

    if (!publicBucket) {
      // Create the public bucket if it doesn't exist
      const { error: createError } = await supabase.storage.createBucket("public", {
        public: true,
        fileSizeLimit: 10485760, // 10MB
      })

      if (createError) {
        return NextResponse.json(
          { success: false, message: `Error creating public bucket: ${createError.message}` },
          { status: 500 },
        )
      }
    }

    // Create icons folder in the public bucket
    const { error: folderError } = await supabase.storage.from("public").upload("icons/.keep", new Blob([""]), {
      upsert: true,
    })

    if (folderError && folderError.message !== "The resource already exists") {
      return NextResponse.json(
        { success: false, message: `Error creating icons folder: ${folderError.message}` },
        { status: 500 },
      )
    }

    return NextResponse.json({ success: true, message: "Icons bucket setup completed successfully" })
  } catch (error) {
    console.error("Error setting up icons bucket:", error)
    return NextResponse.json(
      {
        success: false,
        message: `Error setting up icons bucket: ${error instanceof Error ? error.message : String(error)}`,
      },
      { status: 500 },
    )
  }
}
