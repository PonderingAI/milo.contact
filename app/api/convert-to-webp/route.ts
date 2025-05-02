import { createAdminClient } from "@/lib/supabase-server"
import { type NextRequest, NextResponse } from "next/server"
import sharp from "sharp"
import { currentUser } from "@clerk/nextjs/server"

export const config = {
  api: {
    bodyParser: false,
  },
}

export async function POST(request: NextRequest) {
  try {
    // Check if user is a superAdmin
    const user = await currentUser()

    if (!user || user.publicMetadata.superAdmin !== true) {
      return NextResponse.json({ error: "Only super admins can upload images" }, { status: 403 })
    }

    const formData = await request.formData()
    const file = formData.get("image") as File

    if (!file) {
      return NextResponse.json({ error: "No image file provided" }, { status: 400 })
    }

    // Check if file is an image
    if (!file.type.startsWith("image/") || file.type.includes("svg")) {
      return NextResponse.json({ error: "File is not a supported image format" }, { status: 400 })
    }

    // Convert to buffer
    const buffer = await file.arrayBuffer()

    // Use sharp to convert to WebP with high quality
    const webpBuffer = await sharp(buffer)
      .webp({ quality: 90 }) // High quality for large displays
      .toBuffer()

    // Generate filename
    const originalName = file.name.split(".")[0]
    const webpFilename = `${originalName}-${Date.now()}.webp`

    // Store in a common 'uploads' folder (not segregated by user)
    const filePath = `uploads/${webpFilename}`

    // Upload to Supabase
    const adminClient = createAdminClient()
    const { error: uploadError } = await adminClient.storage.from("media").upload(filePath, webpBuffer, {
      contentType: "image/webp",
      cacheControl: "3600",
      upsert: false,
    })

    if (uploadError) {
      return NextResponse.json({ error: uploadError.message }, { status: 500 })
    }

    // Get public URL
    const {
      data: { publicUrl },
    } = adminClient.storage.from("media").getPublicUrl(filePath)

    return NextResponse.json({
      success: true,
      filename: webpFilename,
      filepath: filePath,
      filesize: webpBuffer.byteLength,
      publicUrl,
    })
  } catch (error) {
    console.error("Error converting image:", error)
    return NextResponse.json(
      { error: `Failed to convert image: ${error instanceof Error ? error.message : String(error)}` },
      { status: 500 },
    )
  }
}
