import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { checkAdminPermission } from "@/lib/auth-server"
import { auth } from "@clerk/nextjs/server"

// GET: Fetch main media for a project
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { userId } = auth()
    
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const projectId = params.id

    // Fetch main media for the project
    const { data, error } = await supabase
      .from("main_media")
      .select("*")
      .eq("project_id", projectId)
      .order("display_order", { ascending: true })

    if (error) {
      console.error("Error fetching main media:", error)
      
      // Check if the error is due to missing table (graceful handling)
      if (error.code === "42P01" || error.message.includes("relation") && error.message.includes("does not exist")) {
        console.log("main_media table does not exist, returning empty response")
        return NextResponse.json({
          success: true,
          media: [], // Legacy format for backward compatibility
          fullData: [], // Legacy format for backward compatibility
          data: [], // Current format
          count: 0
        })
      }
      
      return NextResponse.json({ 
        error: "Error fetching main media",
        details: error.message
      }, { status: 500 })
    }

    // Return response with both legacy and current format for backward compatibility
    return NextResponse.json({
      success: true,
      media: data || [], // Legacy format for backward compatibility
      fullData: data || [], // Legacy format for backward compatibility
      data: data || [], // Current format
      count: data?.length || 0
    })
  } catch (error) {
    console.error("Error in GET main-media API:", error)
    return NextResponse.json({ 
      error: "Internal Server Error",
      details: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 })
  }
}

// DELETE: Remove a specific media item or all media for a project
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { userId } = auth()
    
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check if user has admin role
    const hasAdminPermission = await checkAdminPermission(userId)
    
    if (!hasAdminPermission) {
      return NextResponse.json({ 
        error: "Permission denied. Admin role required." 
      }, { status: 403 })
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const projectId = params.id
    
    // Parse request body to check if we're deleting a specific media item
    let body = null
    try {
      body = await request.json()
    } catch {
      // If no body, we'll delete all media for the project
    }

    if (body && body.mediaId) {
      // Delete specific media item
      const { error } = await supabase
        .from("main_media")
        .delete()
        .eq("id", body.mediaId)
        .eq("project_id", projectId) // Extra safety check

      if (error) {
        console.error("Error deleting media item:", error)
        return NextResponse.json({ 
          error: "Error deleting media item",
          details: error.message
        }, { status: 500 })
      }

      return NextResponse.json({
        success: true,
        message: "Media item deleted successfully"
      })
    } else {
      // Delete all main media for the project
      const { error } = await supabase
        .from("main_media")
        .delete()
        .eq("project_id", projectId)

      if (error) {
        console.error("Error deleting project main media:", error)
        return NextResponse.json({ 
          error: "Error deleting project main media",
          details: error.message
        }, { status: 500 })
      }

      return NextResponse.json({
        success: true,
        message: "All main media deleted successfully"
      })
    }
  } catch (error) {
    console.error("Error in DELETE main-media API:", error)
    return NextResponse.json({ 
      error: "Internal Server Error",
      details: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 })
  }
}