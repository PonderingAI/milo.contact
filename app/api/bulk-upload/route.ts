import { createAdminClient } from "@/lib/supabase-server"
import { type NextRequest, NextResponse } from "next/server"
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
      return NextResponse.json({ error: "Only super admins can upload files" }, { status: 403 })
    }

    const formData = await request.formData()
    const file = formData.get("file") as File
    const index = formData.get("index") as string
    const total = formData.get("total") as string

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 })
    }

    // Generate a unique filename
    const fileExt = file.name.split(".").pop()?.toLowerCase() || ""
    const originalName = file.name.split(".")[0].replace(/[^a-zA-Z0-9]/g, "-")
    const filename = `${originalName}-${Date.now()}.${fileExt}`
    const filePath = `uploads/${filename}`

    // Convert to buffer
    const buffer = await file.arrayBuffer()

    // Upload to Supabase
    const adminClient = createAdminClient()
    const { error: uploadError } = await adminClient.storage.from("media").upload(filePath, Buffer.from(buffer), {
      contentType: file.type,
      cacheControl: "3600",
      upsert: false,
    })

    if (uploadError) {
      return NextResponse.json(
        {
          success: false,
          error: uploadError.message,
          filename: file.name,
          index,
          total,
        },
        { status: 200 },
      ) // Return 200 with error details for the client to handle
    }

    // Get public URL
    const {
      data: { publicUrl },
    } = adminClient.storage.from("media").getPublicUrl(filePath)

    // Determine file type category
    let fileType = "other"
    if (file.type.match(/^image\//i)) fileType = "image"
    else if (file.type.match(/^video\//i)) fileType = "video"
    else if (file.type.match(/^audio\//i)) fileType = "audio"

    // Generate thumbnail for images
    let thumbnailUrl = null
    if (fileType === "image") {
      thumbnailUrl = publicUrl
    }

    // Save to media table
    const { error: dbError } = await adminClient.from("media").insert({
      filename: file.name,
      filepath: filePath,
      filesize: file.size,
      filetype: fileType,
      public_url: publicUrl,
      thumbnail_url: thumbnailUrl,
      tags: [fileType],
      metadata: {
        contentType: file.type,
        uploadedAt: new Date().toISOString(),
        uploadedBy: user?.id || "anonymous",
      },
    })

    if (dbError) {
      return NextResponse.json(
        {
          success: false,
          error: dbError.message,
          filename: file.name,
          index,
          total,
        },
        { status: 200 },
      )
    }

    return NextResponse.json({
      success: true,
      filename: file.name,
      filepath: filePath,
      filesize: file.size,
      publicUrl,
      index,
      total,
    })
  } catch (error) {
    console.error("Error uploading file:", error)
    return NextResponse.json(
      {
        success: false,
        error: `Failed to upload file: ${error instanceof Error ? error.message : String(error)}`,
      },
      { status: 500 },
    )
  }
}
