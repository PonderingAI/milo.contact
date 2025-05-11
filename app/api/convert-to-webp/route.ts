import { createAdminClient } from "@/lib/supabase-server"
import { type NextRequest, NextResponse } from "next/server"
import { currentUser } from "@clerk/nextjs/server"

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

    // Skip conversion and directly upload the original file
    // This avoids the Sharp dependency issues in Vercel environment
    const fileExt = file.name.split(".").pop()?.toLowerCase() || "jpg"
    const originalName = file.name.split(".")[0]
    const safeFilename = `${originalName.replace(/[^a-z0-9]/gi, "-")}-${Date.now()}.${fileExt}`
    const filePath = `uploads/${safeFilename}`

    // Get file buffer
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    // Upload original file to Supabase
    const adminClient = createAdminClient()
    const { error: uploadError } = await adminClient.storage.from("media").upload(filePath, buffer, {
      contentType: file.type,
      cacheControl: "3600",
      upsert: false,
    })

    if (uploadError) {
      console.error("Supabase upload error:", uploadError)
      return NextResponse.json({ error: uploadError.message }, { status: 500 })
    }

    // Get public URL
    const {
      data: { publicUrl },
    } = adminClient.storage.from("media").getPublicUrl(filePath)

    return NextResponse.json({
      success: true,
      filename: safeFilename,
      filepath: filePath,
      filesize: buffer.byteLength,
      publicUrl,
      converted: false,
    })
  } catch (error) {
    console.error("Error uploading image:", error)
    return NextResponse.json(
      { error: `Failed to upload image: ${error instanceof Error ? error.message : String(error)}` },
      { status: 500 },
    )
  }
}
