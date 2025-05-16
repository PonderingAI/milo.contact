import { createAdminClient } from "@/lib/supabase-server"
import { extractVideoInfo } from "@/lib/project-data"
import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const supabase = createAdminClient()
    const { url, isBts = false } = await request.json()

    if (!url) {
      return NextResponse.json({ error: "No URL provided" }, { status: 400 })
    }

    console.log("Processing video URL:", url)
    const videoInfo = extractVideoInfo(url)

    if (!videoInfo) {
      return NextResponse.json({ error: "Invalid video URL format" }, { status: 400 })
    }

    // Process based on platform
    let thumbnailUrl = null
    let videoTitle = null
    let uploadDate = null

    if (videoInfo.platform === "vimeo") {
      try {
        // Get video thumbnail and metadata from Vimeo
        const response = await fetch(`https://vimeo.com/api/v2/video/${videoInfo.id}.json`)
        if (response.ok) {
          const videoData = await response.json()
          const video = videoData[0]
          thumbnailUrl = video.thumbnail_large
          videoTitle = video.title || `Vimeo ${videoInfo.id}`
          uploadDate = video.upload_date ? new Date(video.upload_date).toISOString() : null
        } else {
          console.warn(`Failed to fetch Vimeo metadata: ${response.status} ${response.statusText}`)
          thumbnailUrl = null
          videoTitle = `Vimeo Video ${videoInfo.id}`
        }
      } catch (error) {
        console.error("Error fetching Vimeo metadata:", error)
        thumbnailUrl = null
        videoTitle = `Vimeo Video ${videoInfo.id}`
      }
    } else if (videoInfo.platform === "youtube") {
      thumbnailUrl = `https://img.youtube.com/vi/${videoInfo.id}/hqdefault.jpg`
      videoTitle = `YouTube Video ${videoInfo.id}`
    } else if (videoInfo.platform === "linkedin") {
      thumbnailUrl = "/generic-icon.png"
      videoTitle = `LinkedIn Post ${videoInfo.id}`
    }

    // Add to media library using admin client
    const { data, error } = await supabase
      .from("media")
      .insert({
        filename: videoTitle || `${videoInfo.platform} Video ${videoInfo.id}`,
        filepath: url,
        filesize: 0,
        filetype: videoInfo.platform,
        public_url: url,
        thumbnail_url: thumbnailUrl,
        tags: ["video", videoInfo.platform, ...(isBts ? ["bts"] : [])],
        metadata: {
          [videoInfo.platform + "Id"]: videoInfo.id,
          uploadedBy: "admin", // Since we're using the admin client
          isBts: isBts,
          uploadDate: uploadDate,
        },
      })
      .select()

    if (error) {
      console.error("Error adding video to media library:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      url,
      thumbnailUrl,
      title: videoTitle,
      platform: videoInfo.platform,
      id: videoInfo.id,
      uploadDate,
      data,
    })
  } catch (error) {
    console.error("Error processing video URL:", error)
    return NextResponse.json(
      { error: `Failed to process video URL: ${error instanceof Error ? error.message : String(error)}` },
      { status: 500 },
    )
  }
}
