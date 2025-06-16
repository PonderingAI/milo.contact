import { NextResponse } from "next/server"
import { getRouteHandlerSupabaseClient, checkAdminPermission } from "@/lib/auth-server"
import { auth } from "@clerk/nextjs/server"

export async function DELETE(request: Request) {
  console.log("=== PROJECT DELETE API CALLED ===")
  
  try {
    // Check if user is authenticated
    const { userId } = auth()
    console.log("Auth userId:", userId)
    
    if (!userId) {
      console.log("No userId - returning 401")
      return NextResponse.json({ 
        error: "Unauthorized", 
        debug_userIdFromAuth: null 
      }, { status: 401 })
    }
    
    // Check if user has admin role via Clerk metadata
    const hasAdminPermission = await checkAdminPermission(userId)
    
    if (!hasAdminPermission) {
      return NextResponse.json({ 
        error: "Permission denied. Admin role required.",
        debug_userIdFromAuth: userId,
        supabaseError: "No admin role found in Clerk metadata",
        supabaseCode: "PERMISSION_DENIED"
      }, { status: 403 })
    }

    // Get Supabase client with service role (bypasses RLS)
    const supabase = await getRouteHandlerSupabaseClient()

    // Parse and validate request data
    const { id } = await request.json()

    console.log("Deleting project with ID:", id)

    // Validate required fields
    if (!id) {
      console.error("Missing project ID")
      return NextResponse.json(
        {
          success: false,
          error: "Missing project ID",
          details: "Project ID is required for deletion.",
          debug_userIdFromAuth: userId
        },
        { status: 400 },
      )
    }

    // First, delete associated BTS images
    const { error: btsError } = await supabase
      .from("project_bts_images")
      .delete()
      .eq("project_id", id)

    if (btsError) {
      console.error("Error deleting BTS images:", btsError)
      // Continue with project deletion even if BTS deletion fails
      console.warn("Continuing with project deletion despite BTS deletion error")
    }

    // Delete the project using the service role client (bypasses RLS)
    const { data, error } = await supabase
      .from("projects")
      .delete()
      .eq("id", id)
      .select()

    if (error) {
      console.error("Error deleting project:", error)
      return NextResponse.json(
        {
          success: false,
          error: error.message,
          details: "Database error: " + error.message,
          code: error.code,
          hint: error.hint,
          debug_userIdFromAuth: userId,
          supabaseError: error.message,
          supabaseCode: error.code
        },
        { status: 500 },
      )
    }

    // Check if project was found and deleted
    if (!data || data.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: "Project not found",
          details: "No project found with the specified ID.",
          debug_userIdFromAuth: userId
        },
        { status: 404 },
      )
    }

    return NextResponse.json({
      success: true,
      data,
      message: "Project deleted successfully",
    })
  } catch (error) {
    console.error("=== PROJECT DELETE API ERROR ===", error)
    
    // Always return JSON, never let the error propagate as HTML
    let userId = null
    try {
      const authResult = auth()
      userId = authResult.userId
    } catch (authError) {
      console.error("Error getting userId in catch block:", authError)
    }
    
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error occurred",
        details: "There was an unexpected error processing your request.",
        debug_userIdFromAuth: userId,
        errorMessage: error instanceof Error ? error.message : "Unknown error",
        stack: process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.stack : undefined) : undefined
      },
      { status: 500 },
    )
  }
}