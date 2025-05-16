import { NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase-server"

export async function POST(request: Request) {
  try {
    const { projectId, images } = await request.json()

    if (!projectId || !images || !Array.isArray(images) || images.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid request. Project ID and images array are required.",
        },
        { status: 400 },
      )
    }

    // Use the admin client to bypass RLS
    const supabase = createAdminClient()

    // Format the BTS images data
    const btsImagesData = images.map((imageUrl, index) => ({
      project_id: projectId,
      image_url: imageUrl,
      caption: `BTS Image ${index + 1}`,
      size: "medium",
      aspect_ratio: "landscape",
    }))

    // Insert the BTS images
    const { data, error } = await supabase.from("bts_images").insert(btsImagesData).select()

    if (error) {
      console.error("Error saving BTS images:", error)
      return NextResponse.json(
        {
          success: false,
          error: error.message,
          details: "Failed to save behind-the-scenes images.",
        },
        { status: 500 },
      )
    }

    return NextResponse.json({
      success: true,
      data,
      message: "BTS images saved successfully",
    })
  } catch (error) {
    console.error("Unexpected error saving BTS images:", error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error occurred",
        details: "There was an unexpected error processing your request.",
      },
      { status: 500 },
    )
  }
}
