import { createAdminClient } from "@/lib/supabase-server"
import { type NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"
import { createServerClient } from "@supabase/ssr"

export async function POST(request: NextRequest) {
  try {
    // Use Supabase authentication instead of Clerk
    const cookieStore = cookies()
    const supabase = createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
      cookies: {
        get(name) {
          return cookieStore.get(name)?.value
        },
        set(name, value, options) {
          cookieStore.set({ name, value, ...options })
        },
        remove(name, options) {
          cookieStore.set({ name, value: "", ...options })
        },
      },
    })

    // Check if user is authenticated and has admin role
    const {
      data: { session },
    } = await supabase.auth.getSession()
    const { data: userRoles } = await supabase
      .from("user_roles")
      .select("*")
      .eq("user_id", session?.user?.id || "")
      .single()

    const isAdmin = userRoles?.is_superadmin || false

    if (!session || !isAdmin) {
      return NextResponse.json({ error: "Only super admins can upload files" }, { status: 403 })
    }

    const formData = await request.formData()
    const file = formData.get("file") as File

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 })
    }

    // Create safe filename
    const fileExt = file.name.split(".").pop()?.toLowerCase() || "bin"
    const originalName = file.name.split(".")[0]
    const safeFilename = `${originalName.replace(/[^a-z0-9]/gi, "-")}-${Date.now()}.${fileExt}`
    const filePath = `uploads/${safeFilename}`

    // Get file buffer
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    // Upload file to Supabase
    const adminClient = createAdminClient()
    const { error: uploadError } = await adminClient.storage.from("media").upload(filePath, buffer, {
      contentType: file.type || "application/octet-stream",
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

    // Determine file type category
    let fileType = "other"
    if (filePath.match(/\.(jpg|jpeg|png|webp|avif|gif)$/i)) fileType = "image"
    else if (filePath.match(/\.(mp4|webm|mov|avi)$/i)) fileType = "video"
    else if (filePath.match(/\.(mp3|wav|ogg)$/i)) fileType = "audio"

    // Generate thumbnail for images
    let thumbnailUrl = null
    if (fileType === "image") {
      thumbnailUrl = publicUrl
    }

    // Save to media table
    const { error: dbError } = await adminClient.from("media").insert({
      filename: file.name,
      filepath: filePath,
      filesize: buffer.byteLength,
      filetype: fileType,
      public_url: publicUrl,
      thumbnail_url: thumbnailUrl,
      tags: [fileType],
      metadata: {
        contentType: fileType,
        uploadedAt: new Date().toISOString(),
        uploadedBy: session?.user?.id || "anonymous",
      },
    })

    if (dbError) {
      console.error("Database error:", dbError)
      return NextResponse.json({ error: dbError.message }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      filename: file.name,
      filepath: filePath,
      filesize: buffer.byteLength,
      publicUrl,
    })
  } catch (error) {
    console.error("Error processing upload:", error)
    return NextResponse.json(
      { error: `Failed to process upload: ${error instanceof Error ? error.message : String(error)}` },
      { status: 500 },
    )
  }
}
