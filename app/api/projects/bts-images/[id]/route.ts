import { NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase-server"

export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const projectId = params.id

    if (!projectId) {
      return NextResponse.json(
        {
          success: false,
          error: "Project ID is required",
        },
        { status: 400 },
      )
    }

    // Use the admin client to bypass RLS
    const supabase = createAdminClient()

    // Fetch BTS images for the project
    const { data, error } = await supabase
      .from("bts_images")
      .select("*")
      .eq("project_id", projectId)
      .order("sort_order", { ascending: true })

    if (error) {
      console.error("Error fetching BTS images:", error)
      return NextResponse.json(
        {
          success: false,
          error: error.message,
        },
        { status: 500 },
      )
    }

    // Extract just the image URLs for the response
    const imageUrls = data.map((item) => item.image_url)

    return NextResponse.json({
      success: true,
      images: imageUrls,
      rawData: data, // Include the raw data for debugging
      count: imageUrls.length,
    })
  } catch (error) {
    console.error("Unexpected error fetching BTS images:", error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error occurred",
      },
      { status: 500 },
    )
  }
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    const projectId = params.id

    if (!projectId) {
      return NextResponse.json(
        {
          success: false,
          error: "Project ID is required",
        },
        { status: 400 },
      )
    }

    // Use the admin client to bypass RLS
    const supabase = createAdminClient()

    // Delete all BTS images for the project
    const { error } = await supabase.from("bts_images").delete().eq("project_id", projectId)

    if (error) {
      console.error("Error deleting BTS images:", error)
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
      message: "All BTS images deleted successfully",
    })
  } catch (error) {
    console.error("Unexpected error deleting BTS images:", error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error occurred",
      },
      { status: 500 },
    )
  }
}
