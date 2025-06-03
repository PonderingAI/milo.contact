import { NextResponse } from "next/server"
import { getRouteHandlerSupabaseClient } from "@/lib/auth-server"
import { auth } from "@clerk/nextjs/server"

export async function POST(request: Request) {
  console.log("=== PROJECT CREATE API CALLED ===")
  
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
    
    // Get authenticated Supabase client that syncs Clerk with Supabase
    const supabase = await getRouteHandlerSupabaseClient()
    
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

    // Parse and validate project data
    const projectData = await request.json()

    console.log("Received project data:", projectData)

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
          debug_userIdFromAuth: userId
        },
        { status: 400 },
      )
    }

    // Insert the project using the authenticated client
    const { data, error } = await supabase.from("projects").insert([projectData]).select()

    if (error) {
      console.error("Error creating project:", error)
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

    return NextResponse.json({
      success: true,
      data,
      message: "Project created successfully",
    })
  } catch (error) {
    console.error("=== PROJECT CREATE API ERROR ===", error)
    
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
