import { NextResponse } from "next/server"
import { checkMediaDuplicate } from "@/lib/media-utils"

/**
 * API route to check if a media item already exists in the library
 * This can be used by client-side code to check for duplicates before uploading
 */
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { url, fileHash, filename, filepath } = body

    // Validate input
    if (!url && !fileHash && !filename && !filepath) {
      return NextResponse.json(
        { error: "At least one of url, fileHash, filename, or filepath must be provided" },
        { status: 400 },
      )
    }

    // Check for duplicates
    const result = await checkMediaDuplicate({
      url,
      fileHash,
      filename,
      filepath,
    })

    return NextResponse.json(result)
  } catch (error) {
    console.error("Error checking for media duplicates:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error occurred" },
      { status: 500 },
    )
  }
}
