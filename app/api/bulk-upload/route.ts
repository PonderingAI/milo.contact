import { NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase-server"
import { checkMediaDuplicate } from "@/lib/media-utils"
import sharp from "sharp"
import { v4 as uuidv4 } from "uuid"
import crypto from "crypto"

export const maxDuration = 60 // Set max duration to 60 seconds

export async function POST(request: Request) {
  try {
    // Get the file from the request
    const formData = await request.formData()
    const file = formData.get("file") as File

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 })
    }

    // Get file details
    const filename = file.name
    const filesize = file.size
    const fileBuffer = Buffer.from(await file.arrayBuffer())

    // Calculate file hash for duplicate detection using SHA-256 (same as client-side)
    const fileHash = crypto.createHash("sha256").update(fileBuffer).digest("hex")
    console.log(`Calculated hash for ${filename}: ${fileHash}`)

    // Check for duplicates using our universal duplicate checker
    const duplicateCheck = await checkMediaDuplicate({
      fileHash,
      filename,
    })

    if (duplicateCheck.isDuplicate) {
      // Duplicate found
      console.log("Duplicate file found:", duplicateCheck.existingItem)
      return NextResponse.json(
        {
          duplicate: true,
          existingFile: duplicateCheck.existingItem,
          message: duplicateCheck.reason || `File already exists as "${duplicateCheck.existingItem.filename}"`,
          matchType: duplicateCheck.matchType,
        },
        { status: 200 },
      )
    }

    // Determine file type and handle accordingly
    const fileType = file.type.split("/")[0]
    const fileExtension = filename.split(".").pop()?.toLowerCase() || ""

    let uploadPath = ""
    let publicUrl = ""
    const thumbnailUrl = null
    let convertedToWebP = false

    // Handle image files - convert to WebP for better performance
    if (fileType === "image" && ["jpg", "jpeg", "png", "gif"].includes(fileExtension)) {
      try {
        // Generate a unique filename for the WebP version
        const webpFilename = `${uuidv4()}.webp`
        uploadPath = `media/${webpFilename}`

        // Convert to WebP format
        const webpBuffer = await sharp(fileBuffer).webp({ quality: 85 }).toBuffer()

        // Upload the WebP file
        const { error: uploadError, data } = await createServerClient()
          .storage.from("public")
          .upload(uploadPath, webpBuffer, {
            contentType: "image/webp",
            upsert: false,
          })

        if (uploadError) {
          throw new Error(`WebP upload failed: ${uploadError.message}`)
        }

        // Get the public URL
        const {
          data: { publicUrl: url },
        } = createServerClient().storage.from("public").getPublicUrl(uploadPath)

        publicUrl = url
        convertedToWebP = true
      } catch (error) {
        console.error("WebP conversion failed:", error)

        // Fallback to original format if WebP conversion fails
        uploadPath = `media/${uuidv4()}-${filename}`

        const { error: uploadError } = await createServerClient()
          .storage.from("public")
          .upload(uploadPath, fileBuffer, {
            contentType: file.type,
            upsert: false,
          })

        if (uploadError) {
          throw new Error(`Original upload failed: ${uploadError.message}`)
        }

        const {
          data: { publicUrl: url },
        } = createServerClient().storage.from("public").getPublicUrl(uploadPath)

        publicUrl = url
      }
    } else {
      // Handle other file types without conversion
      uploadPath = `media/${uuidv4()}-${filename}`

      const { error: uploadError } = await createServerClient().storage.from("public").upload(uploadPath, fileBuffer, {
        contentType: file.type,
        upsert: false,
      })

      if (uploadError) {
        throw new Error(`Upload failed: ${uploadError.message}`)
      }

      const {
        data: { publicUrl: url },
      } = createServerClient().storage.from("public").getPublicUrl(uploadPath)

      publicUrl = url
    }

    // Add record to the media table with race condition protection
    const { error: insertError, data: insertedData } = await createServerClient()
      .from("media")
      .insert({
        filename,
        filepath: uploadPath,
        filesize,
        filetype: fileType,
        public_url: publicUrl,
        thumbnail_url: thumbnailUrl,
        tags: [fileType],
        metadata: {
          originalType: file.type,
          fileHash: fileHash,
          convertedToWebP,
          originalFilename: filename,
        },
      })
      .select()

    if (insertError) {
      // Check if this is a race condition duplicate by doing another duplicate check
      console.log("Insert failed, checking for race condition:", insertError.message)
      
      const raceConditionCheck = await checkMediaDuplicate({
        fileHash,
        filename,
      })
      
      if (raceConditionCheck.isDuplicate) {
        // Another thread inserted the same file while we were processing
        console.log("Race condition detected - file was inserted by another process")
        return NextResponse.json(
          {
            duplicate: true,
            existingFile: raceConditionCheck.existingItem,
            message: `File already exists (race condition detected)`,
            matchType: raceConditionCheck.matchType,
          },
          { status: 200 },
        )
      }
      
      // Not a race condition, it's a real error
      throw new Error(`Database insert failed: ${insertError.message}`)
    }

    return NextResponse.json({
      success: true,
      filename,
      publicUrl,
      convertedToWebP,
      mediaItem: insertedData && insertedData.length > 0 ? insertedData[0] : null,
    })
  } catch (error) {
    console.error("Upload error:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error occurred" },
      { status: 500 },
    )
  }
}
