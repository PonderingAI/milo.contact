import { NextResponse } from "next/server"
import { getRouteHandlerSupabaseClient, checkAdminPermission } from "@/lib/auth-server"
import { auth } from "@clerk/nextjs/server"

export async function POST(request: Request) {
  try {
    console.log("=== BTS DEBUG TEST START ===")
    
    // Check if user is authenticated
    const { userId } = auth()
    console.log("Auth userId:", userId)
    
    if (!userId) {
      return NextResponse.json({ 
        error: "Unauthorized", 
        debug_userIdFromAuth: null,
        step: "auth_check"
      }, { status: 401 })
    }
    
    // Get authenticated Supabase client
    console.log("Getting Supabase client...")
    const supabase = await getRouteHandlerSupabaseClient()
    console.log("Supabase client obtained")
    
    // Parse request body
    const req = await request.json()
    console.log("Request body:", req)
    
    const { projectId, images, replaceExisting, testMode } = req

    if (!projectId || !images || !Array.isArray(images)) {
      return NextResponse.json({ 
        error: "Project ID and images are required",
        debug_userIdFromAuth: userId,
        step: "validation",
        received: { projectId, images: images ? `array[${images.length}]` : images }
      }, { status: 400 })
    }

    // Check if user has admin role via Clerk metadata
    console.log("Checking admin role for user:", userId)
    const hasAdminPermission = await checkAdminPermission(userId)
    console.log("Admin permission result:", hasAdminPermission)
    
    if (!hasAdminPermission) {
      return NextResponse.json({ 
        error: "Permission denied. Admin role required.",
        debug_userIdFromAuth: userId,
        supabaseError: "No admin role found in Clerk metadata",
        supabaseCode: "PERMISSION_DENIED",
        step: "role_check"
      }, { status: 403 })
    }

    // Check if project exists
    console.log("Checking if project exists:", projectId)
    const { data: projectData, error: projectError } = await supabase
      .from('projects')
      .select('id, title')
      .eq('id', projectId)
      .maybeSingle()
    
    console.log("Project check result:", { projectData, projectError })
    
    if (projectError) {
      return NextResponse.json({ 
        error: "Error checking project",
        debug_userIdFromAuth: userId,
        supabaseError: projectError.message,
        supabaseCode: projectError.code,
        step: "project_check"
      }, { status: 500 })
    }
    
    if (!projectData) {
      return NextResponse.json({ 
        error: "Project not found",
        debug_userIdFromAuth: userId,
        projectId,
        step: "project_check"
      }, { status: 404 })
    }

    // Check bts_images table structure
    console.log("Checking bts_images table structure...")
    const { data: tableCheck, error: tableError } = await supabase
      .from('bts_images')
      .select('*')
      .limit(1)
    
    console.log("Table structure check:", { tableCheck, tableError })

    if (testMode) {
      return NextResponse.json({
        success: true,
        test: true,
        debug: {
          userId,
          projectData,
          roleData,
          tableStructureCheck: { tableCheck, tableError },
          step: "test_completed"
        }
      })
    }

    // Delete existing images if requested
    if (replaceExisting) {
      console.log("Deleting existing BTS images for project:", projectId)
      const { error: deleteError } = await supabase
        .from("bts_images")
        .delete()
        .eq("project_id", projectId)

      console.log("Delete result:", { deleteError })

      if (deleteError) {
        console.error("Error deleting existing BTS images:", deleteError)
        return NextResponse.json({ 
          error: "Error deleting existing BTS images",
          debug_userIdFromAuth: userId,
          supabaseError: deleteError.message,
          supabaseCode: deleteError.code,
          step: "delete_existing"
        }, { status: 500 })
      }
    }

    // Prepare BTS image data - use the actual table schema
    console.log("Preparing BTS image data...")
    const btsImageData = images.map((image, index) => ({
      project_id: projectId,
      image_url: image,
      category: 'general',
      caption: `BTS Image ${index + 1}`
    }))
    
    console.log("BTS image data prepared:", btsImageData)

    // Insert BTS images
    console.log("Inserting BTS images...")
    const { data, error } = await supabase
      .from("bts_images")
      .insert(btsImageData)
      .select()

    console.log("Insert result:", { data, error })

    if (error) {
      console.error("Error inserting BTS images:", error)
      return NextResponse.json({ 
        error: "Error inserting BTS images", 
        debug_userIdFromAuth: userId,
        supabaseError: error.message,
        supabaseCode: error.code,
        details: error.details,
        hint: error.hint,
        step: "insert_bts"
      }, { status: 500 })
    }

    console.log("=== BTS DEBUG TEST SUCCESS ===")

    // Return success response with inserted data
    return NextResponse.json({
      success: true,
      data: data || [],
      message: `Successfully processed ${data?.length || 0} BTS images`,
      count: data?.length || 0,
      debug: {
        userId,
        projectData,
        roleData,
        btsImageData,
        step: "completed"
      }
    })
  } catch (error) {
    console.error("=== BTS DEBUG TEST ERROR ===", error)
    const { userId } = auth()
    
    return NextResponse.json({ 
      error: "Internal Server Error", 
      debug_userIdFromAuth: userId,
      errorMessage: error instanceof Error ? error.message : "Unknown error",
      stack: process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.stack : undefined) : undefined,
      step: "catch_block"
    }, { status: 500 })
  }
}