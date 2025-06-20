import { NextResponse } from "next/server"
import { getRouteHandlerSupabaseClient, checkAdminPermission } from "@/lib/auth-server"
import { auth } from "@clerk/nextjs/server"

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  try {
    const projectId = params.id
    
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
    
    const projectData = await request.json()

    console.log("Updating project with data:", projectData)

    // Validate required fields
    const requiredFields = ["title", "image", "category", "role"]
    const missingFields = requiredFields.filter((field) => {
      const value = projectData[field]
      return value === undefined || value === null || value === ""
    })

    if (missingFields.length > 0) {
      console.error(`Missing required fields: ${missingFields.join(", ")}`, {
        receivedData: projectData,
      })

      return NextResponse.json(
        {
          success: false,
          error: `Missing required fields: ${missingFields.join(", ")}`,
          details: "Please fill in all required fields before submitting.",
          receivedData: projectData,
          debug_userIdFromAuth: userId,
        },
        { status: 400 },
      )
    }

    // Update the project using service role client (bypasses RLS)
    const { data, error } = await supabase.from("projects").update(projectData).eq("id", projectId).select()

    if (error) {
      console.error("Error updating project:", error)
      return NextResponse.json(
        {
          success: false,
          error: error.message,
          details: "Database error: " + error.message,
          code: error.code,
          hint: error.hint,
          debug_userIdFromAuth: userId,
          supabaseError: error.message,
          supabaseCode: error.code,
        },
        { status: 500 },
      )
    }

    return NextResponse.json({
      success: true,
      data,
      message: "Project updated successfully",
    })
  } catch (error) {
    console.error("Unexpected error updating project:", error)
    
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
