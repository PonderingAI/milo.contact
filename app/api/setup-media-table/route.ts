import { createAdminClient } from "@/lib/supabase-server"
import { NextResponse } from "next/server"
import fs from "fs"
import path from "path"

export async function GET() {
  try {
    const supabase = createAdminClient()

    // Read the SQL file
    const sqlFilePath = path.join(process.cwd(), "setup", "create-media-table.sql")
    const sqlContent = fs.readFileSync(sqlFilePath, "utf8")

    // Execute the SQL
    const { error } = await supabase.rpc("exec_sql", { sql: sqlContent })

    if (error) {
      console.error("Error setting up media table:", error)
      return NextResponse.json(
        { success: false, message: `Error setting up media table: ${error.message}` },
        { status: 500 },
      )
    }

    // Create the media storage bucket if it doesn't exist
    const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets()

    if (bucketsError) {
      console.error("Error listing buckets:", bucketsError)
      return NextResponse.json(
        { success: false, message: `Error listing buckets: ${bucketsError.message}` },
        { status: 500 },
      )
    }

    // Check if media bucket exists
    const mediaBucket = buckets?.find((bucket) => bucket.name === "media")

    if (!mediaBucket) {
      // Create the media bucket
      const { error: createError } = await supabase.storage.createBucket("media", {
        public: true,
        fileSizeLimit: 10485760, // 10MB
      })

      if (createError) {
        console.error("Error creating media bucket:", createError)
        return NextResponse.json(
          { success: false, message: `Error creating media bucket: ${createError.message}` },
          { status: 500 },
        )
      }
    }

    return NextResponse.json({
      success: true,
      message: "Media table and storage bucket set up successfully",
    })
  } catch (error) {
    console.error("Error in setup-media-table:", error)
    return NextResponse.json(
      {
        success: false,
        message: `Error setting up media table: ${error instanceof Error ? error.message : String(error)}`,
      },
      { status: 500 },
    )
  }
}
