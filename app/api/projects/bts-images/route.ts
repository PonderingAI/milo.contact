import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { getRouteHandlerSupabaseClient } from "@/lib/auth-server"
import { auth } from "@clerk/nextjs"

export async function POST(request: Request) {
  try {
    // Check if user is authenticated and has admin role
    const { userId } = auth()
    if (!userId) {
      return NextResponse.json({ 
        error: "Unauthorized", 
        debug_userIdFromAuth: null 
      }, { status: 401 })
    }
    
    // Get authenticated Supabase client that syncs Clerk with Supabase
    const supabase = await getRouteHandlerSupabaseClient()
    
    // Parse request body
    const req = await request.json()
    const { projectId, images, replaceExisting } = req

    if (!projectId || !images || !Array.isArray(images)) {
      return NextResponse.json({ 
        error: "Project ID and images are required",
        debug_userIdFromAuth: userId
      }, { status: 400 })
    }

    // Check if user has admin role
    const { data: roleData, error: roleError } = await supabase
      .from('user_roles')
      .select('*')
      .eq('user_id', userId)
      .eq('role', 'admin')
    
    if (roleError || !roleData || roleData.length === 0) {
      return NextResponse.json({ 
        error: "Permission denied. Admin role required.",
        debug_userIdFromAuth: userId,
        supabaseError: roleError?.message || "No admin role found",
        supabaseCode: roleError?.code || "PERMISSION_DENIED"
      }, { status: 403 })
    }

    // Delete existing images if requested
    if (replaceExisting) {
      const { error: deleteError } = await supabase.from("bts_images").delete().eq("project_id", projectId)

      if (deleteError) {
        console.error("Error deleting existing BTS images:", deleteError)
        return NextResponse.json({ 
          error: "Error deleting existing BTS images",
          debug_userIdFromAuth: userId,
          supabaseError: deleteError.message,
          supabaseCode: deleteError.code
        }, { status: 500 })
      }
    }

    // Prepare BTS image data - use the actual table schema
    const btsImageData = images.map((image) => ({
      project_id: projectId,
      image_url: image,
    }))

    // Insert BTS images
    const { data, error } = await supabase.from("bts_images").insert(btsImageData).select()

    if (error) {
      console.error("Error inserting BTS images:", error)
      return NextResponse.json({ 
        error: "Error inserting BTS images", 
        debug_userIdFromAuth: userId,
        supabaseError: error.message,
        supabaseCode: error.code,
        details: error.details
      }, { status: 500 })
    }

    // Return success response with inserted data
    return NextResponse.json({
      success: true,
      data: data || [],
      message: `Successfully processed ${data?.length || 0} BTS images`,
      count: data?.length || 0
    })
  } catch (error) {
    console.error("Error processing request:", error)
    const { userId } = auth()
    
    return NextResponse.json({ 
      error: "Internal Server Error", 
      debug_userIdFromAuth: userId,
      errorMessage: error instanceof Error ? error.message : "Unknown error",
      stack: process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.stack : undefined) : undefined
    }, { status: 500 })
  }
}