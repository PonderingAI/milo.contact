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

    // Step 1: Update the default value for the column
    await supabase.rpc('exec_sql', {
      sql: 'ALTER TABLE main_media ALTER COLUMN is_thumbnail_hidden SET DEFAULT FALSE;'
    })

    // Step 2: Update existing records that were set to TRUE due to the incorrect default
    const { data: updateResult, error: updateError } = await supabase.rpc('exec_sql', {
      sql: `
        UPDATE main_media 
        SET is_thumbnail_hidden = FALSE 
        WHERE is_thumbnail_hidden = TRUE 
          AND (
            -- Regular images should be visible
            (is_video = FALSE AND video_url IS NULL) 
            OR 
            -- Videos should be visible 
            (is_video = TRUE AND video_url IS NOT NULL)
          );
      `
    })

    if (updateError) {
      console.error("Error updating visibility:", updateError)
      return NextResponse.json({ 
        error: "Failed to update visibility",
        details: updateError.message
      }, { status: 500 })
    }

    // Step 3: Keep actual video thumbnail entries hidden
    const { data: thumbnailResult, error: thumbnailError } = await supabase.rpc('exec_sql', {
      sql: `
        UPDATE main_media 
        SET is_thumbnail_hidden = TRUE 
        WHERE is_video = FALSE 
          AND video_url IS NULL 
          AND image_url IN (
            -- Find images that are thumbnails for videos in the same project
            SELECT m2.image_url 
            FROM main_media m2 
            WHERE m2.is_video = TRUE 
              AND m2.project_id = main_media.project_id
              AND m2.image_url = main_media.image_url
          );
      `
    })

    if (thumbnailError) {
      console.error("Error updating thumbnail visibility:", thumbnailError)
      return NextResponse.json({ 
        error: "Failed to update thumbnail visibility",
        details: thumbnailError.message
      }, { status: 500 })
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