import { createAdminClient } from "@/lib/supabase-server"
import { extractVideoInfo, fetchYouTubeTitle } from "@/lib/project-data"
import { checkMediaDuplicate } from "@/lib/media-utils"
import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const supabase = createAdminClient()
    const { url, isBts = false } = await request.json()

    if (!url || typeof url !== 'string' || url.trim() === '') {
      return NextResponse.json({ error: "No valid URL provided" }, { status: 400 })
    }

    console.log("Processing video URL:", url)
    const videoInfo = extractVideoInfo(url.trim())

    if (!videoInfo) {
      return NextResponse.json({ error: "Invalid video URL format" }, { status: 400 })
    }

    // Check for duplicates using our universal duplicate checker
    const duplicateCheck = await checkMediaDuplicate({ url })

    if (duplicateCheck.isDuplicate) {
      // Duplicate found
      console.log("Duplicate video found:", duplicateCheck.existingItem)
      return NextResponse.json(
        {
          duplicate: true,
          existingVideo: duplicateCheck.existingItem,
          message: duplicateCheck.reason || `Video already exists as "${duplicateCheck.existingItem.filename}"`,
          matchType: duplicateCheck.matchType,
        },
        { status: 200 },
      )
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

      // Use YouTube Data API if available to get both title and upload date
      const apiKey = process.env.YOUTUBE_API_KEY
      if (apiKey) {
        try {
          const response = await fetch(
            `https://www.googleapis.com/youtube/v3/videos?id=${videoInfo.id}&part=snippet&key=${apiKey}`
          )
          
          if (response.ok) {
            const data = await response.json()
            if (data.items && data.items.length > 0) {
              const snippet = data.items[0].snippet
              videoTitle = snippet.title || `YouTube Video: ${videoInfo.id}`
              uploadDate = snippet.publishedAt ? new Date(snippet.publishedAt).toISOString() : null
            } else {
              // Fall back to oEmbed API for title only
              const youtubeTitle = await fetchYouTubeTitle(videoInfo.id)
              videoTitle = youtubeTitle || `YouTube Video: ${videoInfo.id}`
            }
          } else {
            // Fall back to oEmbed API for title only
            const youtubeTitle = await fetchYouTubeTitle(videoInfo.id)
            videoTitle = youtubeTitle || `YouTube Video: ${videoInfo.id}`
          }
        } catch (error) {
          console.error("Error fetching YouTube data from API:", error)
          // Fall back to oEmbed API for title only
          try {
            const youtubeTitle = await fetchYouTubeTitle(videoInfo.id)
            videoTitle = youtubeTitle || `YouTube Video: ${videoInfo.id}`
          } catch (oembedError) {
            console.error("Error fetching YouTube title from oEmbed:", oembedError)
            videoTitle = `YouTube Video: ${videoInfo.id}`
          }
        }
      } else {
        // No API key available, use oEmbed API for title only
        try {
          const youtubeTitle = await fetchYouTubeTitle(videoInfo.id)
          videoTitle = youtubeTitle || `YouTube Video: ${videoInfo.id}`
        } catch (error) {
          console.error("Error fetching YouTube title:", error)
          videoTitle = `YouTube Video: ${videoInfo.id}`
        }
      }
    } else if (videoInfo.platform === "linkedin") {
      thumbnailUrl = "/generic-icon.png"
      videoTitle = `LinkedIn Post ${videoInfo.id}`
    }

    // Validate that we have essential data before database insertion
    if (!videoTitle || videoTitle.trim() === '') {
      videoTitle = `${videoInfo.platform} Video ${videoInfo.id}`
    }

    // Validate required data before insertion
    if (!url.trim() || !videoTitle.trim()) {
      console.error("Missing required data for media insertion:", { url, videoTitle })
      return NextResponse.json({ error: "Missing required data for media insertion" }, { status: 400 })
    }

    // Add to media library using admin client
    // Try both possible column names: file_path and filepath
    const baseMediaData = {
      filename: videoTitle,
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
        originalUrl: url,
        title: videoTitle,
      },
    }

    console.log("Attempting to insert media data:", baseMediaData)

    // First try with file_path
    let data, error
    try {
      const result = await supabase
        .from("media")
        .insert({
          ...baseMediaData,
          file_path: url,
        })
        .select()
      
      data = result.data
      error = result.error
    } catch (firstError) {
      console.log("First attempt with file_path failed, trying filepath:", firstError)
      // If that fails, try with filepath
      try {
        const result = await supabase
          .from("media")
          .insert({
            ...baseMediaData,
            filepath: url,
          })
          .select()
        
        data = result.data
        error = result.error
      } catch (secondError) {
        console.error("Both column name attempts failed:", { firstError, secondError })
        error = secondError
      }
    }

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
