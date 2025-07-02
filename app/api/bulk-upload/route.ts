import { NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase-server"
import { checkMediaDuplicate } from "@/lib/media-utils"
import sharp from "sharp"
import { v4 as uuidv4 } from "uuid"
import crypto from "crypto"

export const maxDuration = 300 // Set max duration to 5 minutes for large image processing

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
    
    // Validate file size before processing (max 100MB)
    if (filesize > 100 * 1024 * 1024) {
      return NextResponse.json({ 
        error: "File too large. Maximum file size is 100MB. Please compress your image first." 
      }, { status: 413 })
    }

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

    // Handle image files - convert to WebP for better performance with advanced compression for large images
    if (fileType === "image" && ["jpg", "jpeg", "png", "gif", "bmp", "tiff", "webp"].includes(fileExtension)) {
      try {
        // Generate a unique filename for the WebP version
        const webpFilename = `${uuidv4()}.webp`
        uploadPath = `media/${webpFilename}`

        // Get image metadata to determine processing strategy
        let imageInfo
        try {
          imageInfo = await sharp(fileBuffer).metadata()
        } catch (metadataError) {
          console.error("Failed to read image metadata:", metadataError)
          throw new Error("Invalid or corrupted image file")
        }
        
        const { width = 0, height = 0 } = imageInfo
        
        console.log(`Processing image: ${filename}, size: ${filesize} bytes, dimensions: ${width}x${height}`)

        // Validate image dimensions
        if (width * height > 268402689) { // ~16K x 16K pixels max
          throw new Error("Image dimensions too large. Please resize your image before uploading.")
        }

        // Determine compression settings based on file size and dimensions
        let quality = 85 // Default quality
        let maxWidth = 3840 // 4K width as default max
        let maxHeight = 2160 // 4K height as default max
        
        // Aggressive compression for large files (>10MB)
        if (filesize > 10 * 1024 * 1024) {
          quality = 70
          maxWidth = 2560  // Reduce to 1440p width for very large files
          maxHeight = 1440 // Reduce to 1440p height for very large files
          console.log(`Large file detected (${Math.round(filesize / 1024 / 1024)}MB), using aggressive compression`)
        }
        
        // Very aggressive compression for huge files (>25MB)
        if (filesize > 25 * 1024 * 1024) {
          quality = 60
          maxWidth = 1920  // Reduce to 1080p width for huge files
          maxHeight = 1080 // Reduce to 1080p height for huge files
          console.log(`Huge file detected (${Math.round(filesize / 1024 / 1024)}MB), using very aggressive compression`)
        }
        
        // Extreme compression for massive files (>40MB)
        if (filesize > 40 * 1024 * 1024) {
          quality = 50
          maxWidth = 1600  // Reduce further for massive files
          maxHeight = 900
          console.log(`Massive file detected (${Math.round(filesize / 1024 / 1024)}MB), using extreme compression`)
        }

        // Start with Sharp pipeline with error handling
        let sharpPipeline
        try {
          sharpPipeline = sharp(fileBuffer, {
            // Optimize memory usage for large images
            limitInputPixels: 268402689 // ~16K x 16K pixels max
          })
        } catch (sharpInitError) {
          console.error("Failed to initialize Sharp:", sharpInitError)
          throw new Error("Failed to process image. The image may be corrupted or in an unsupported format.")
        }

        // Resize if image is larger than max dimensions
        if (width > maxWidth || height > maxHeight) {
          sharpPipeline = sharpPipeline.resize(maxWidth, maxHeight, {
            fit: 'inside', // Maintain aspect ratio
            withoutEnlargement: true // Don't upscale smaller images
          })
          console.log(`Resizing image from ${width}x${height} to max ${maxWidth}x${maxHeight}`)
        }

        // Convert to WebP with optimized settings for large images
        let webpBuffer
        try {
          webpBuffer = await sharpPipeline
            .webp({
              quality,
              effort: 6, // Higher effort for better compression (0-6, 6 is best)
              progressive: true, // Progressive loading for better UX
              smartSubsample: true, // Better quality at low bitrates
              reductionEffort: 6, // Maximum effort for file size reduction
              alphaQuality: quality - 10, // Slightly lower quality for alpha channel
              nearLossless: false, // Use lossy compression for better file size reduction
              mixed: true // Allow mixed lossless/lossy compression
            })
            .toBuffer()
        } catch (webpError) {
          console.error("WebP conversion failed:", webpError)
          throw new Error("Failed to convert image to WebP format. The image may be too complex or corrupted.")
        }

        const compressionRatio = Math.round((1 - webpBuffer.length / filesize) * 100)
        console.log(`WebP conversion complete: ${Math.round(webpBuffer.length / 1024)}KB (${compressionRatio}% reduction from original)`)

        // Upload the WebP file
        const { error: uploadError, data } = await createServerClient()
          .storage.from("public")
          .upload(uploadPath, webpBuffer, {
            contentType: "image/webp",
            upsert: false,
          })

        if (uploadError) {
          console.error("WebP upload error:", uploadError)
          throw new Error(`Failed to upload processed image: ${uploadError.message}`)
        }

        // Get the public URL
        const {
          data: { publicUrl: url },
        } = createServerClient().storage.from("public").getPublicUrl(uploadPath)

        publicUrl = url
        convertedToWebP = true
      } catch (error) {
        console.error("Image processing failed:", error)

        // For very large files, don't fallback to original - this would defeat the purpose
        if (filesize > 25 * 1024 * 1024) {
          const errorMessage = error instanceof Error ? error.message : 'Unknown processing error'
          return NextResponse.json({ 
            error: `Image too large and processing failed: ${errorMessage}. Please try a smaller image or compress it first.` 
          }, { status: 413 })
        }

        // Fallback to original format only for smaller files if WebP conversion fails
        try {
          uploadPath = `media/${uuidv4()}-${filename}`

          const { error: uploadError } = await createServerClient()
            .storage.from("public")
            .upload(uploadPath, fileBuffer, {
              contentType: file.type,
              upsert: false,
            })

          if (uploadError) {
            throw new Error(`Fallback upload failed: ${uploadError.message}`)
          }

          const {
            data: { publicUrl: url },
          } = createServerClient().storage.from("public").getPublicUrl(uploadPath)

          publicUrl = url
        } catch (fallbackError) {
          console.error("Fallback upload failed:", fallbackError)
          const errorMessage = fallbackError instanceof Error ? fallbackError.message : 'Unknown upload error'
          return NextResponse.json({ 
            error: `Image processing and fallback upload failed: ${errorMessage}` 
          }, { status: 500 })
        }
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
        filesize, // Keep original filesize for now - we could enhance this later to track compressed size
        filetype: fileType,
        public_url: publicUrl,
        thumbnail_url: thumbnailUrl,
        tags: [fileType],
        metadata: {
          originalType: file.type,
          fileHash: fileHash,
          convertedToWebP,
          originalFilename: filename,
          originalFilesize: filesize,
          compressionApplied: convertedToWebP && filesize > 10 * 1024 * 1024,
          processingTimestamp: new Date().toISOString(),
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
