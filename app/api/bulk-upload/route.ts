import { createAdminClient } from "@/lib/supabase-server"
import { type NextRequest, NextResponse } from "next/server"
import sharp from "sharp"

export async function POST(request: NextRequest) {
  try {
    // Get the Supabase client
    const supabase = createAdminClient()

    const formData = await request.formData()
    const file = formData.get("file") as File

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 })
    }

    // Get file buffer
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    // Create safe filename base (without extension)
    const originalName = file.name.split(".")[0]
    const safeFilenameBase = originalName.replace(/[^a-z0-9]/gi, "-")

    // Determine file type category
    let fileType = "other"
    let filePath = ""
    let processedBuffer = buffer
    let contentType = file.type || "application/octet-stream"

    // Check if it's an image that can be converted to WebP
    const isConvertibleImage =
      file.type && ["image/jpeg", "image/png", "image/gif", "image/jpg"].includes(file.type.toLowerCase())

    if (isConvertibleImage) {
      fileType = "image"
      filePath = `uploads/${safeFilenameBase}-${Date.now()}.webp`
      contentType = "image/webp"

      try {
        // Convert to WebP
        processedBuffer = await sharp(buffer).webp({ quality: 85 }).toBuffer()

        console.log(`Converted ${file.name} to WebP format`)
      } catch (conversionError) {
        console.error("WebP conversion error:", conversionError)
        // Fallback to original format if conversion fails
        const fileExt = file.name.split(".").pop()?.toLowerCase() || "bin"
        filePath = `uploads/${safeFilenameBase}-${Date.now()}.${fileExt}`
        processedBuffer = buffer
        contentType = file.type || "application/octet-stream"

        console.log(`Falling back to original format for ${file.name}`)
      }
    } else if (file.type && file.type.startsWith("video/")) {
      fileType = "video"
      const fileExt = file.name.split(".").pop()?.toLowerCase() || "mp4"
      filePath = `uploads/${safeFilenameBase}-${Date.now()}.${fileExt}`
    } else if (file.type && file.type.startsWith("audio/")) {
      fileType = "audio"
      const fileExt = file.name.split(".").pop()?.toLowerCase() || "mp3"
      filePath = `uploads/${safeFilenameBase}-${Date.now()}.${fileExt}`
    } else {
      // Other file types
      const fileExt = file.name.split(".").pop()?.toLowerCase() || "bin"
      filePath = `uploads/${safeFilenameBase}-${Date.now()}.${fileExt}`
    }

    // Upload file to Supabase with retry logic
    let uploadError = null
    let retries = 3

    while (retries > 0) {
      try {
        const { error } = await supabase.storage.from("media").upload(filePath, processedBuffer, {
          contentType: contentType,
          cacheControl: "3600",
          upsert: false,
        })

        if (!error) {
          uploadError = null
          break
        }

        uploadError = error
        console.warn(`Upload attempt failed (${retries} retries left):`, error.message)
        retries--

        if (retries > 0) {
          // Wait before retrying (exponential backoff)
          await new Promise((resolve) => setTimeout(resolve, (3 - retries) * 1000))
        }
      } catch (err) {
        uploadError = err
        console.warn(`Upload attempt exception (${retries} retries left):`, err)
        retries--

        if (retries > 0) {
          // Wait before retrying (exponential backoff)
          await new Promise((resolve) => setTimeout(resolve, (3 - retries) * 1000))
        }
      }
    }

    if (uploadError) {
      console.error("Supabase upload error after retries:", uploadError)
      return NextResponse.json(
        {
          error: uploadError.message || "Failed to upload file after multiple attempts",
          success: false,
        },
        { status: 500 },
      )
    }

    // Get public URL
    const {
      data: { publicUrl },
    } = supabase.storage.from("media").getPublicUrl(filePath)

    // Generate thumbnail for images
    let thumbnailUrl = null
    if (fileType === "image") {
      thumbnailUrl = publicUrl
    }

    // Save to media table with retry logic
    let dbError = null
    retries = 3

    while (retries > 0) {
      try {
        const { error } = await supabase.from("media").insert({
          filename: isConvertibleImage ? `${originalName}.webp` : file.name,
          filepath: filePath,
          filesize: processedBuffer.byteLength,
          filetype: fileType,
          public_url: publicUrl,
          thumbnail_url: thumbnailUrl,
          tags: [fileType],
          metadata: {
            contentType: contentType,
            originalType: file.type,
            originalName: file.name,
            uploadedAt: new Date().toISOString(),
            uploadedBy: "admin", // Since we're using the admin client
            convertedToWebP: isConvertibleImage,
          },
        })

        if (!error) {
          dbError = null
          break
        }

        dbError = error
        console.warn(`Database insert attempt failed (${retries} retries left):`, error.message)
        retries--

        if (retries > 0) {
          // Wait before retrying (exponential backoff)
          await new Promise((resolve) => setTimeout(resolve, (3 - retries) * 1000))
        }
      } catch (err) {
        dbError = err
        console.warn(`Database insert exception (${retries} retries left):`, err)
        retries--

        if (retries > 0) {
          // Wait before retrying (exponential backoff)
          await new Promise((resolve) => setTimeout(resolve, (3 - retries) * 1000))
        }
      }
    }

    if (dbError) {
      console.error("Database error after retries:", dbError)
      return NextResponse.json(
        {
          error: dbError.message || "Failed to save file metadata after multiple attempts",
          success: false,
        },
        { status: 500 },
      )
    }

    return NextResponse.json({
      success: true,
      filename: isConvertibleImage ? `${originalName}.webp` : file.name,
      filepath: filePath,
      filesize: processedBuffer.byteLength,
      publicUrl,
      convertedToWebP: isConvertibleImage,
    })
  } catch (error) {
    console.error("Error processing upload:", error)
    return NextResponse.json(
      {
        error: `Failed to process upload: ${error instanceof Error ? error.message : String(error)}`,
        success: false,
      },
      { status: 500 },
    )
  }
}
