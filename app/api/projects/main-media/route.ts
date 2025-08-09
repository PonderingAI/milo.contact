import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { checkAdminPermission } from "@/lib/auth-server"
import { auth } from "@clerk/nextjs/server"

// Unified video processing function
async function processVideoUrl(url: string): Promise<{
  platform: string
  id: string
  embedUrl: string
  thumbnailUrl: string
  title?: string
} | null> {
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

    // LinkedIn URL patterns
    const linkedinPatterns = [
      /(?:https?:\/\/)?(?:www\.)?linkedin\.com\/posts\/.*-(\d+)-/i,
      /(?:https?:\/\/)?(?:www\.)?linkedin\.com\/feed\/update\/.*:(\d+)/i,
    ]

    // Check YouTube patterns
    for (const pattern of youtubePatterns) {
      const match = url.match(pattern)
      if (match && match[1]) {
        const videoId = match[1]
        return {
          platform: "youtube",
          id: videoId,
          embedUrl: `https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0&modestbranding=1&mute=0`,
          thumbnailUrl: `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`,
          title: `YouTube Video ${videoId}`
        }
      }
    }

    // Check Vimeo patterns
    for (const pattern of vimeoPatterns) {
      const match = url.match(pattern)
      if (match && match[1]) {
        const videoId = match[1]
        let thumbnailUrl = "/generic-icon.png"
        let title = `Vimeo Video ${videoId}`
        
        // Try to fetch Vimeo thumbnail with improved error handling
        try {
          console.log(`Attempting to fetch Vimeo metadata for video ID: ${videoId}`)
          const response = await fetch(`https://vimeo.com/api/v2/video/${videoId}.json`, {
            headers: {
              'User-Agent': 'milo.contact/1.0'
            }
          })
          
          if (response.ok) {
            const videoData = await response.json()
            if (videoData && Array.isArray(videoData) && videoData.length > 0) {
              const video = videoData[0]
              if (video.thumbnail_large) {
                thumbnailUrl = video.thumbnail_large
                console.log(`Successfully fetched Vimeo thumbnail: ${thumbnailUrl}`)
              }
              if (video.title) {
                title = video.title
                console.log(`Successfully fetched Vimeo title: ${title}`)
              }
            } else {
              console.warn(`Vimeo API returned empty or invalid data for video ${videoId}`)
            }
          } else {
            console.warn(`Failed to fetch Vimeo metadata: ${response.status} ${response.statusText}`)
            // Try alternative thumbnail sizes if large fails
            try {
              const altResponse = await fetch(`https://vimeo.com/api/v2/video/${videoId}.json`)
              if (altResponse.ok) {
                const altData = await altResponse.json()
                if (altData && altData[0] && altData[0].thumbnail_medium) {
                  thumbnailUrl = altData[0].thumbnail_medium
                  console.log(`Used fallback Vimeo thumbnail: ${thumbnailUrl}`)
                }
              }
            } catch (altError) {
              console.error("Fallback Vimeo API also failed:", altError)
            }
          }
        } catch (error) {
          console.error("Error fetching Vimeo metadata:", error)
          // Additional fallback: construct thumbnail URL directly if possible
          try {
            thumbnailUrl = `https://i.vimeocdn.com/video/${videoId}_640x360.jpg`
            console.log(`Using constructed Vimeo thumbnail URL: ${thumbnailUrl}`)
          } catch (constructError) {
            console.error("Could not construct fallback thumbnail URL:", constructError)
          }
        }
        
        return {
          platform: "vimeo",
          id: videoId,
          embedUrl: `https://player.vimeo.com/video/${videoId}?autoplay=1&title=0&byline=0&portrait=0&muted=0`,
          thumbnailUrl,
          title
        }
      }
    }

    // Check LinkedIn patterns
    for (const pattern of linkedinPatterns) {
      const match = url.match(pattern)
      if (match && match[1]) {
        const videoId = match[1]
        return {
          platform: "linkedin",
          id: videoId,
          embedUrl: url, // LinkedIn doesn't have embeddable URLs like YouTube/Vimeo
          thumbnailUrl: "/generic-icon.png",
          title: `LinkedIn Post ${videoId}`
        }
      }
    }

    return null
  } catch (error) {
    console.error("Error processing video URL:", error)
    return null
  }
}

export async function POST(request: Request) {
  console.log("=== MAIN MEDIA API CALLED ===")
  
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
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )
    
    // Parse request body
    const req = await request.json()
    const { projectId, media, replaceExisting } = req

    if (!projectId || !media || !Array.isArray(media)) {
      return NextResponse.json({ 
        error: "Project ID and media are required",
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

    // Delete existing main media if requested
    if (replaceExisting) {
      const { error: deleteError } = await supabase.from("main_media").delete().eq("project_id", projectId)

      if (deleteError) {
        console.error("Error deleting existing main media:", deleteError)
        return NextResponse.json({ 
          error: "Error deleting existing main media",
          debug_userIdFromAuth: userId,
          supabaseError: deleteError.message,
          supabaseCode: deleteError.code
        }, { status: 500 })
      }
    }

    // Process media items and create entries according to user requirements
    const mainMediaData = []
    let displayOrder = 0

    for (const mediaUrl of media) {
      const videoInfo = await processVideoUrl(mediaUrl)
      
      if (videoInfo) {
        // This is a video URL - create a single video entry with thumbnail preview
        // The thumbnail is stored as image_url for preview purposes
        // No separate thumbnail entry is created to avoid duplication
        
        mainMediaData.push({
          project_id: projectId,
          image_url: videoInfo.thumbnailUrl, // Thumbnail for video preview
          is_video: true,
          video_url: videoInfo.embedUrl,
          video_platform: videoInfo.platform,
          video_id: videoInfo.id,
          display_order: displayOrder++,
          caption: videoInfo.title,
          is_thumbnail_hidden: false // Video with thumbnail preview is always visible
        })
      } else {
        // Regular image
        mainMediaData.push({
          project_id: projectId,
          image_url: mediaUrl,
          is_video: false,
          video_url: null,
          video_platform: null,
          video_id: null,
          display_order: displayOrder++,
          is_thumbnail_hidden: false // Regular images are visible by default
        })
      }
    }

    // Insert main media
    const { data, error } = await supabase.from("main_media").insert(mainMediaData).select()

    if (error) {
      console.error("Error inserting main media:", error)
      return NextResponse.json({ 
        error: "Error inserting main media", 
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
      message: `Successfully processed ${data?.length || 0} main media items`,
      count: data?.length || 0
    })
  } catch (error) {
    console.error("=== MAIN MEDIA API ERROR ===", error)
    
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