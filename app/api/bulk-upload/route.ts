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

    // Upload file to Supabase
    const { error: uploadError, data: uploadData } = await supabase.storage
      .from("media")
      .upload(filePath, processedBuffer, {
        contentType: contentType,
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

    // Generate thumbnail for images
    let thumbnailUrl = null
    if (fileType === "image") {
      thumbnailUrl = publicUrl
    }

    // Check if media table exists before trying to insert
    const { error: tableCheckError } = await supabase.from("media").select("id").limit(1).maybeSingle()

    if (tableCheckError && tableCheckError.code === "PGRST116") {
      // Table doesn't exist, create it
      const { error: createTableError } = await supabase.rpc("exec_sql", {
        sql_query: `
          CREATE TABLE IF NOT EXISTS media (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            filename TEXT NOT NULL,
            filepath TEXT NOT NULL,
            filesize BIGINT NOT NULL DEFAULT 0,
            filetype TEXT NOT NULL,
            public_url TEXT NOT NULL,
            thumbnail_url TEXT,
            tags TEXT[] DEFAULT '{}',
            metadata JSONB DEFAULT '{}',
            usage_locations JSONB DEFAULT '{}',
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
          );
          
          -- Add RLS policy to allow all operations for authenticated users
          ALTER TABLE media ENABLE ROW LEVEL SECURITY;
          
          DROP POLICY IF EXISTS "Allow all operations for authenticated users" ON media;
          CREATE POLICY "Allow all operations for authenticated users" 
          ON media 
          USING (auth.role() = 'authenticated')
          WITH CHECK (auth.role() = 'authenticated');
        `,
      })

      if (createTableError) {
        console.error("Error creating media table:", createTableError)
        // Continue anyway, as the upload was successful
      }
    }

    // Save to media table using admin privileges
    const { error: dbError } = await supabase.from("media").insert({
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

    if (dbError) {
      console.error("Database error:", dbError)
      // Return success anyway since the file was uploaded
      return NextResponse.json({
        success: true,
        warning: "File uploaded but database entry failed: " + dbError.message,
        filename: isConvertibleImage ? `${originalName}.webp` : file.name,
        filepath: filePath,
        filesize: processedBuffer.byteLength,
        publicUrl,
        convertedToWebP: isConvertibleImage,
      })
    }

    return NextResponse.json({
      success: true,
      filename: isConvertibleImage ? `${originalName}.webp` : file.name,
      filepath: filePath,
      filesize: processedBuffer.byteLength,
      publicUrl, // Make sure this is the correct property name
      convertedToWebP: isConvertibleImage,
    })
  } catch (error) {
    console.error("Error processing upload:", error)
    return NextResponse.json(
      { error: `Failed to process upload: ${error instanceof Error ? error.message : String(error)}` },
      { status: 500 },
    )
  }
}
