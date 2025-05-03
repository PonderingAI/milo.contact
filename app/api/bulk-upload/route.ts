import { createAdminClient } from "@/lib/supabase-server"
import { type NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"

export async function POST(request: NextRequest) {
  try {
    // Get the Supabase client
    const supabase = createAdminClient()

    // Get the session from cookies
    const cookieStore = cookies()
    const sessionCookie = cookieStore.get("sb-azggzulgpfuyubdouhcu-auth-token")?.value

    // Log authentication attempt for debugging
    console.log("Authentication attempt with session cookie:", !!sessionCookie)

    let isAdmin = false
    let userId = null

    // Check if user is authenticated and has admin role
    if (sessionCookie) {
      try {
        const parsedSession = JSON.parse(sessionCookie)
        userId = parsedSession?.user?.id

        if (userId) {
          // Check if user is a superadmin in the database
          const { data: userRoles, error: rolesError } = await supabase
            .from("user_roles")
            .select("is_superadmin")
            .eq("user_id", userId)
            .single()

          if (rolesError) {
            console.error("Error checking user roles:", rolesError)
          } else {
            isAdmin = userRoles?.is_superadmin === true
            console.log(`User ${userId} admin status:`, isAdmin)
          }
        }
      } catch (parseError) {
        console.error("Error parsing session cookie:", parseError)
      }
    }

    // For development/testing - allow uploads without auth check
    // Remove this in production
    if (process.env.NODE_ENV === "development") {
      isAdmin = true
      console.log("Development mode: Bypassing auth check")
    }

    if (!isAdmin) {
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
    const { error: uploadError } = await supabase.storage.from("media").upload(filePath, buffer, {
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
    } = supabase.storage.from("media").getPublicUrl(filePath)

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
    const { error: dbError } = await supabase.from("media").insert({
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
        uploadedBy: userId || "anonymous",
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
