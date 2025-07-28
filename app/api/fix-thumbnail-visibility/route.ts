import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { checkAdminPermission } from "@/lib/auth-server"
import { auth } from "@clerk/nextjs/server"

export async function POST() {
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

    console.log("Starting thumbnail visibility migration...")

    // Step 1: Update existing records that were set to TRUE due to the incorrect default
    // We'll use standard Supabase update methods instead of raw SQL
    const { data: updateResult, error: updateError } = await supabase
      .from("main_media")
      .update({ is_thumbnail_hidden: false })
      .or('and(is_video.eq.false,video_url.is.null),and(is_video.eq.true,video_url.not.is.null)')
      .eq('is_thumbnail_hidden', true)

    if (updateError) {
      console.error("Error updating visibility:", updateError)
      return NextResponse.json({ 
        error: "Failed to update visibility",
        details: updateError.message
      }, { status: 500 })
    }

    // Step 2: Handle video thumbnail entries that should remain hidden
    // First, get all video entries to identify their thumbnails
    const { data: videoEntries, error: videoError } = await supabase
      .from("main_media")
      .select("project_id, image_url")
      .eq("is_video", true)

    if (videoError) {
      console.error("Error fetching video entries:", videoError)
      return NextResponse.json({ 
        error: "Failed to fetch video entries",
        details: videoError.message
      }, { status: 500 })
    }

    // Create a set of thumbnail URLs that should remain hidden
    const thumbnailUrlsToHide = new Set<string>()
    if (videoEntries) {
      videoEntries.forEach(video => {
        thumbnailUrlsToHide.add(video.image_url)
      })
    }

    // Update non-video entries that are thumbnails for videos to be hidden
    if (thumbnailUrlsToHide.size > 0) {
      const { data: thumbnailResult, error: thumbnailError } = await supabase
        .from("main_media")
        .update({ is_thumbnail_hidden: true })
        .eq("is_video", false)
        .is("video_url", null)
        .in("image_url", Array.from(thumbnailUrlsToHide))

      if (thumbnailError) {
        console.error("Error updating thumbnail visibility:", thumbnailError)
        return NextResponse.json({ 
          error: "Failed to update thumbnail visibility",
          details: thumbnailError.message
        }, { status: 500 })
      }
    }

    // Get final count of visible vs hidden media
    const { data: stats, error: statsError } = await supabase
      .from("main_media")
      .select("is_thumbnail_hidden")

    let visibleCount = 0
    let hiddenCount = 0
    
    if (stats && !statsError) {
      stats.forEach(item => {
        if (item.is_thumbnail_hidden) {
          hiddenCount++
        } else {
          visibleCount++
        }
      })
    }

    console.log("Thumbnail visibility migration completed successfully")

    return NextResponse.json({
      success: true,
      message: "Thumbnail visibility migration completed successfully",
      stats: {
        visibleMedia: visibleCount,
        hiddenThumbnails: hiddenCount,
        total: visibleCount + hiddenCount
      }
    })
  } catch (error) {
    console.error("Error in thumbnail visibility migration:", error)
    return NextResponse.json({ 
      error: "Internal Server Error",
      details: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 })
  }
} 