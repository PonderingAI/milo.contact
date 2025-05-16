import { NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase-server"

export async function POST(request: Request) {
  try {
    const { projectId, images, caption = "", category = "general" } = await request.json()

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

    // Prepare the data for insertion
    const btsImagesData = images.map((imageUrl, index) => ({
      project_id: projectId,
      image_url: imageUrl,
      caption: caption || `BTS Image ${index + 1}`,
      category: category || "general",
      sort_order: index,
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
      message: "BTS images added successfully",
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
