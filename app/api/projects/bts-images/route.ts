import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { checkAdminPermission } from "@/lib/auth-server"
import { auth } from "@clerk/nextjs/server"

export async function POST(request: Request) {
  console.log("=== BTS IMAGES API CALLED ===")
  
  try {
    // Check if user is authenticated and has admin role
    const { userId } = auth()
    console.log("Auth userId:", userId)
    
    if (!userId) {
      console.log("No userId - returning 401")
      return NextResponse.json({ 
        error: "Unauthorized", 
        debug_userIdFromAuth: null 
      }, { status: 401 })
    }
    
    // Get authenticated Supabase client with service role to bypass RLS
    // Since we're already checking admin permissions via Clerk metadata above
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )
    
    // Parse request body
    const req = await request.json()
    const { projectId, images, replaceExisting } = req

    if (!projectId || !images || !Array.isArray(images)) {
      return NextResponse.json({ 
        error: "Project ID and images are required",
        debug_userIdFromAuth: userId
      }, { status: 400 })
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

    // Helper function to extract video info from URL
    function extractVideoInfo(url: string): { platform: string; id: string } | null {
      try {
        if (!url || typeof url !== "string") return null

        // YouTube URL patterns
        const youtubePatterns = [
          /(?:https?:\/\/)?(?:www\.)?youtube\.com\/watch\?v=([^&]+)/i,
          /(?:https?:\/\/)?(?:www\.)?youtube\.com\/embed\/([^?]+)/i,
          /(?:https?:\/\/)?(?:www\.)?youtu\.be\/([^?]+)/i,
        ]

        // Vimeo URL patterns
        const vimeoPatterns = [
          /(?:https?:\/\/)?(?:www\.)?vimeo\.com\/(\d+)/i,
          /(?:https?:\/\/)?(?:www\.)?player\.vimeo\.com\/video\/(\d+)/i,
        ]

        // Check YouTube patterns
        for (const pattern of youtubePatterns) {
          const match = url.match(pattern)
          if (match && match[1]) {
            return { platform: "youtube", id: match[1] }
          }
        }

        // Check Vimeo patterns
        for (const pattern of vimeoPatterns) {
          const match = url.match(pattern)
          if (match && match[1]) {
            return { platform: "vimeo", id: match[1] }
          }
        }

        return null
      } catch (error) {
        console.error("Error extracting video info:", error)
        return null
      }
    }

    // Prepare BTS image data with video detection and processing
    const btsImageData = images.map((imageUrl) => {
      const videoInfo = extractVideoInfo(imageUrl)
      
      if (videoInfo) {
        // This is a video URL - construct proper embed URL and metadata
        let embedUrl = ""
        let thumbnailUrl = imageUrl // Use original URL as fallback thumbnail

        if (videoInfo.platform === "youtube") {
          embedUrl = `https://www.youtube.com/embed/${videoInfo.id}?autoplay=1&rel=0&modestbranding=1&mute=0`
          thumbnailUrl = `https://img.youtube.com/vi/${videoInfo.id}/maxresdefault.jpg`
        } else if (videoInfo.platform === "vimeo") {
          embedUrl = `https://player.vimeo.com/video/${videoInfo.id}?autoplay=1&title=0&byline=0&portrait=0&muted=0`
          // Keep original URL as thumbnail for Vimeo (more complex to get thumbnail)
        }

        return {
          project_id: projectId,
          image_url: thumbnailUrl, // Store thumbnail URL for display
          is_video: true,
          video_url: embedUrl,
          video_platform: videoInfo.platform,
          video_id: videoInfo.id,
          caption: imageUrl, // Store original URL in caption field for reconstruction
        }
      } else {
        // Regular image
        return {
          project_id: projectId,
          image_url: imageUrl,
          is_video: false,
          video_url: null,
          video_platform: null,
          video_id: null,
        }
      }
    })

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
    console.error("=== BTS IMAGES API ERROR ===", error)
    
    // Always return JSON, never let the error propagate as HTML
    let userId = null
    try {
      const authResult = auth()
      userId = authResult.userId
    } catch (authError) {
      console.error("Error getting userId in catch block:", authError)
    }
    
    return NextResponse.json({ 
      error: "Internal Server Error", 
      debug_userIdFromAuth: userId,
      errorMessage: error instanceof Error ? error.message : "Unknown error",
      stack: process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.stack : undefined) : undefined
    }, { status: 500 })
  }
}