import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { checkAdminPermission } from "@/lib/auth-server"
import { auth } from "@clerk/nextjs/server"

export async function POST(request: Request) {
  try {
    const { userId } = auth()
    
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check admin permission
    const hasAdminPermission = await checkAdminPermission(userId)
    if (!hasAdminPermission) {
      return NextResponse.json({ error: "Permission denied. Admin role required." }, { status: 403 })
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const { projectId, videoMediaId, imageUrl } = await request.json()

    if (!projectId || !videoMediaId || !imageUrl) {
      return NextResponse.json({ error: "projectId, videoMediaId, and imageUrl are required" }, { status: 400 })
    }

    // Fetch the video media row to validate
    const { data: videoRow, error: fetchError } = await supabase
      .from("main_media")
      .select("id, project_id, is_video, image_url")
      .eq("id", videoMediaId)
      .maybeSingle()

    if (fetchError) {
      return NextResponse.json({ error: "Failed to fetch video media", details: fetchError.message }, { status: 500 })
    }

    if (!videoRow) {
      return NextResponse.json({ error: "Video media not found" }, { status: 404 })
    }

    if (!videoRow.is_video || videoRow.project_id !== projectId) {
      return NextResponse.json({ error: "Invalid video media specified" }, { status: 400 })
    }

    // Update the video's image_url to the new thumbnail URL
    const { data: updatedVideoRows, error: updateVideoError } = await supabase
      .from("main_media")
      .update({ image_url: imageUrl })
      .eq("id", videoMediaId)
      .select()

    if (updateVideoError) {
      return NextResponse.json({ error: "Failed to update video thumbnail", details: updateVideoError.message }, { status: 500 })
    }

    const updatedVideo = updatedVideoRows?.[0] || null

    // Ensure there is a hidden image entry for this thumbnail
    const { data: existingThumb, error: findThumbError } = await supabase
      .from("main_media")
      .select("id, is_thumbnail_hidden")
      .eq("project_id", projectId)
      .eq("image_url", imageUrl)
      .eq("is_video", false)
      .maybeSingle()

    if (findThumbError) {
      return NextResponse.json({ error: "Failed to check existing thumbnail", details: findThumbError.message }, { status: 500 })
    }

    let ensuredHiddenThumb = existingThumb || null

    if (!existingThumb) {
      // Insert a hidden image row
      const { data: thumbInsertRows, error: insertThumbError } = await supabase
        .from("main_media")
        .insert({
          project_id: projectId,
          image_url: imageUrl,
          is_video: false,
          video_url: null,
          video_platform: null,
          video_id: null,
          display_order: updatedVideo?.display_order ?? 0,
          caption: "Custom Thumbnail",
          is_thumbnail_hidden: true
        })
        .select()

      if (insertThumbError) {
        return NextResponse.json({ error: "Failed to insert hidden thumbnail", details: insertThumbError.message }, { status: 500 })
      }

      ensuredHiddenThumb = thumbInsertRows?.[0] || null
    } else if (existingThumb && existingThumb.is_thumbnail_hidden !== true) {
      const { data: updatedThumbRows, error: updateThumbError } = await supabase
        .from("main_media")
        .update({ is_thumbnail_hidden: true })
        .eq("id", existingThumb.id)
        .select()

      if (updateThumbError) {
        return NextResponse.json({ error: "Failed to hide existing thumbnail", details: updateThumbError.message }, { status: 500 })
      }

      ensuredHiddenThumb = updatedThumbRows?.[0] || existingThumb
    }

    return NextResponse.json({
      success: true,
      data: {
        video: updatedVideo,
        hiddenThumbnail: ensuredHiddenThumb
      }
    })
  } catch (error) {
    return NextResponse.json({ 
      error: "Internal Server Error", 
      details: error instanceof Error ? error.message : "Unknown error" 
    }, { status: 500 })
  }
}


