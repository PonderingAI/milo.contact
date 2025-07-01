import { NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase-server"
import { checkAdminPermission } from "@/lib/auth-server"
import { auth } from "@clerk/nextjs/server"

export async function DELETE(request: Request) {
  try {
    // Parse request body to get project ID and image URL
    const { projectId, imageUrl } = await request.json()

    if (!projectId || !imageUrl) {
      return NextResponse.json(
        {
          success: false,
          error: "Project ID and image URL are required",
        },
        { status: 400 },
      )
    }

    // Check authentication
    const { userId } = auth()
    if (!userId) {
      return NextResponse.json({ 
        error: "Unauthorized" 
      }, { status: 401 })
    }

    // Check admin permission
    const hasAdminPermission = await checkAdminPermission(userId)
    if (!hasAdminPermission) {
      return NextResponse.json({ 
        error: "Permission denied. Admin role required."
      }, { status: 403 })
    }

    // Use the admin client to bypass RLS
    const supabase = createAdminClient()

    // Delete the specific BTS item by project_id and image_url
    const { data: deletedItems, error: deleteError } = await supabase
      .from("bts_images")
      .delete()
      .eq("project_id", projectId)
      .eq("image_url", imageUrl)
      .select()

    if (deleteError) {
      console.error("Error deleting BTS item:", deleteError)
      return NextResponse.json(
        {
          success: false,
          error: deleteError.message,
        },
        { status: 500 },
      )
    }

    return NextResponse.json({
      success: true,
      message: "BTS item deleted successfully",
      deletedCount: deletedItems?.length || 0,
      deletedItems: deletedItems || []
    })
  } catch (error) {
    console.error("Unexpected error deleting BTS item:", error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error occurred",
      },
      { status: 500 },
    )
  }
}