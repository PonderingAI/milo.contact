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

    // Fetch main media for the project
    const { data, error } = await supabase
      .from("main_media")
      .select("*")
      .eq("project_id", projectId)
      .order("display_order", { ascending: true })
      .order("created_at", { ascending: true })

    if (error) {
      console.error("Error fetching main media:", error)
      
      // If the table doesn't exist, return empty result instead of error
      if (error.code === '42P01' || error.message.includes('does not exist')) {
        console.log("main_media table does not exist, returning empty result")
        return NextResponse.json({
          success: true,
          media: [],
          fullData: [],
          count: 0,
        })
      }
      
      return NextResponse.json(
        {
          success: false,
          error: error.message,
        },
        { status: 500 },
      )
    }

    // Extract just the media URLs for the response (for backward compatibility)
    const mediaUrls = data.map((item) => item.image_url)

    return NextResponse.json({
      success: true,
      media: mediaUrls,
      fullData: data, // Include the full data with video info
      count: mediaUrls.length,
    })
  } catch (error) {
    console.error("Unexpected error fetching main media:", error)
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

    // Delete all main media for the project
    const { error } = await supabase.from("main_media").delete().eq("project_id", projectId)

    if (error) {
      console.error("Error deleting main media:", error)
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
      message: "All main media deleted successfully",
    })
  } catch (error) {
    console.error("Unexpected error deleting main media:", error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error occurred",
      },
      { status: 500 },
    )
  }
}