import { NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase-server"

export async function POST(request: Request) {
  try {
    const { projectId, images, caption = "", category = "general", replaceExisting = false } = await request.json()

    if (!projectId) {
      return NextResponse.json(
        {
          success: false,
          error: "Project ID is required",
        },
        { status: 400 },
      )
    }

    if (!images || !Array.isArray(images) || images.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: "At least one image URL is required",
        },
        { status: 400 },
      )
    }

    // Use the admin client to bypass RLS
    const supabase = createAdminClient()

    // Start a transaction for consistency
    // First, check if we need to delete existing BTS images
    if (replaceExisting) {
      const { error: deleteError } = await supabase.from("bts_images").delete().eq("project_id", projectId)

      if (deleteError) {
        console.error("Error deleting existing BTS images:", deleteError)
        return NextResponse.json(
          {
            success: false,
            error: `Failed to replace existing BTS images: ${deleteError.message}`,
          },
          { status: 500 },
        )
      }
    }

    // Check for duplicates to avoid adding the same image multiple times
    const { data: existingImages, error: fetchError } = await supabase
      .from("bts_images")
      .select("image_url")
      .eq("project_id", projectId)

    if (fetchError) {
      console.error("Error fetching existing BTS images:", fetchError)
      // Continue anyway, as this is not a critical error
    }

    // Filter out duplicates if we have existing images
    let uniqueImages = images
    if (existingImages && existingImages.length > 0 && !replaceExisting) {
      const existingUrls = existingImages.map((img) => img.image_url)
      uniqueImages = images.filter((url) => !existingUrls.includes(url))

      if (uniqueImages.length === 0) {
        return NextResponse.json({
          success: true,
          message: "All BTS images already exist for this project",
          duplicatesSkipped: images.length,
        })
      }
    }

    // Prepare the data for insertion
    const btsImagesData = uniqueImages.map((imageUrl, index) => ({
      project_id: projectId,
      image_url: imageUrl,
      caption: caption || `BTS Image ${index + 1}`,
      category: category || "general",
      sort_order: index + (existingImages?.length || 0), // Append to existing sort order
    }))

    // Insert the BTS images
    const { data, error } = await supabase.from("bts_images").insert(btsImagesData).select()

    if (error) {
      console.error("Error adding BTS images:", error)
      return NextResponse.json(
        {
          success: false,
          error: error.message,
        },
        { status: 500 },
      )
    }

    return NextResponse.json({
      success: true,
      data,
      message: `${btsImagesData.length} BTS images added successfully`,
      duplicatesSkipped: replaceExisting ? 0 : images.length - uniqueImages.length,
    })
  } catch (error) {
    console.error("Unexpected error adding BTS images:", error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error occurred",
      },
      { status: 500 },
    )
  }
}
