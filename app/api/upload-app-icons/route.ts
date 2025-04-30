import { createServerClient } from "@/lib/supabase"
import { type NextRequest, NextResponse } from "next/server"
import JSZip from "jszip"

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const zipFile = formData.get("zipFile") as File

    if (!zipFile) {
      return NextResponse.json({ success: false, message: "No file provided" }, { status: 400 })
    }

    // Check if file is a zip
    if (!zipFile.name.endsWith(".zip") && zipFile.type !== "application/zip") {
      return NextResponse.json({ success: false, message: "File must be a zip archive" }, { status: 400 })
    }

    const supabase = createServerClient()

    // Ensure the public bucket exists
    const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets()

    if (bucketsError) {
      return NextResponse.json(
        { success: false, message: `Error listing buckets: ${bucketsError.message}` },
        { status: 500 },
      )
    }

    // Check if public bucket exists
    const publicBucket = buckets?.find((bucket) => bucket.name === "public")

    if (!publicBucket) {
      // Create the public bucket
      const { error: createError } = await supabase.storage.createBucket("public", {
        public: true,
        fileSizeLimit: 10485760, // 10MB
      })

      if (createError) {
        return NextResponse.json(
          { success: false, message: `Error creating bucket: ${createError.message}` },
          { status: 500 },
        )
      }
    }

    // Read the zip file
    const arrayBuffer = await zipFile.arrayBuffer()
    const zip = new JSZip()
    const contents = await zip.loadAsync(arrayBuffer)

    // Upload each file in the zip
    const uploadedFiles: Record<string, string> = {}

    for (const [filename, zipFile] of Object.entries(contents.files)) {
      // Skip directories
      if (zipFile.dir) continue

      // Skip manifest.json and browserconfig.xml for now
      if (filename === "manifest.json" || filename === "browserconfig.xml") continue

      const blob = await zipFile.async("blob")

      // Upload to Supabase Storage
      const { data, error: uploadError } = await supabase.storage.from("public").upload(`icons/${filename}`, blob, {
        cacheControl: "3600",
        upsert: true,
      })

      if (uploadError) {
        return NextResponse.json(
          { success: false, message: `Failed to upload ${filename}: ${uploadError.message}` },
          { status: 500 },
        )
      }

      // Get public URL
      const {
        data: { publicUrl },
      } = supabase.storage.from("public").getPublicUrl(`icons/${filename}`)

      uploadedFiles[filename] = publicUrl
    }

    // Update site settings with the uploaded files
    for (const [filename, url] of Object.entries(uploadedFiles)) {
      const { error: settingError } = await supabase.from("site_settings").upsert({
        key: `icon_${filename.replace(/[^a-zA-Z0-9]/g, "_")}`,
        value: url,
      })

      if (settingError) {
        console.error(`Error updating setting for ${filename}:`, settingError)
      }
    }

    return NextResponse.json({
      success: true,
      message: "App icons uploaded successfully",
      files: uploadedFiles,
    })
  } catch (error) {
    console.error("Error uploading app icons:", error)
    return NextResponse.json(
      {
        success: false,
        message: `Error uploading app icons: ${error instanceof Error ? error.message : String(error)}`,
      },
      { status: 500 },
    )
  }
}

export const config = {
  api: {
    bodyParser: false,
  },
}
