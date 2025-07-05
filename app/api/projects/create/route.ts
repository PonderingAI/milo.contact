import { NextResponse } from "next/server"
import { getRouteHandlerSupabaseClient, checkAdminPermission } from "@/lib/auth-server"
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

    // Parse and validate project data
    const projectData = await request.json()

    console.log("Received project data:", projectData)

    // Extract main media arrays from project data
    const { mainImages = [], mainVideos = [], ...projectDataWithoutMedia } = projectData

    // Validate required fields
    const requiredFields = ["title", "image", "category", "role"]
    const missingFields = requiredFields.filter((field) => {
      const value = projectDataWithoutMedia[field]
      return value === undefined || value === null || value === ""
    })

    if (missingFields.length > 0) {
      console.error(`Missing required fields: ${missingFields.join(", ")}`, {
        receivedData: projectDataWithoutMedia,
      })

      return NextResponse.json(
        {
          success: false,
          error: `Missing required fields: ${missingFields.join(", ")}`,
          details: "Please fill in all required fields before submitting.",
          receivedData: projectDataWithoutMedia,
          debug_userIdFromAuth: userId
        },
        { status: 400 },
      )
    }

    // Insert the project using the service role client (bypasses RLS)
    const { data, error } = await supabase.from("projects").insert([projectDataWithoutMedia]).select()

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

    const createdProject = data[0]
    console.log("Project created successfully:", createdProject.id)

    // Process main media if provided
    if ((mainImages.length > 0 || mainVideos.length > 0) && createdProject?.id) {
      console.log("Processing main media for project:", createdProject.id)
      
      try {
        // Combine all main media URLs
        const allMainMediaUrls = [...mainImages, ...mainVideos]
        
        // Process each media URL through the unified video processing
        for (const mediaUrl of allMainMediaUrls) {
          if (!mediaUrl) continue
          
          console.log("Processing main media URL:", mediaUrl)
          
          // Call the unified main media processing API
          const mediaResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/projects/main-media`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              projectId: createdProject.id,
              mediaUrl: mediaUrl
            }),
          })

          if (!mediaResponse.ok) {
            const errorData = await mediaResponse.json()
            console.error("Error processing main media:", errorData)
            // Continue with other media URLs even if one fails
          } else {
            const mediaResult = await mediaResponse.json()
            console.log("Main media processed successfully:", mediaResult)
          }
        }
      } catch (mediaError) {
        console.error("Error processing main media:", mediaError)
        // Don't fail the entire project creation if media processing fails
      }
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
