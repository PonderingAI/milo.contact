import { createAdminClient } from "@/lib/supabase-server"
import { extractVideoInfo, fetchYouTubeTitle } from "@/lib/project-data"
import { checkMediaDuplicate } from "@/lib/media-utils"
import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const supabase = createAdminClient()
    const { url, isBts = false } = await request.json()

    console.log("=== process-video-url API called ===")
    console.log("Request payload:", { url, isBts })

    if (!url || typeof url !== 'string' || url.trim() === '') {
      console.error("process-video-url: Invalid URL provided:", url)
      return NextResponse.json({ error: "No valid URL provided" }, { status: 400 })
    }

    const trimmedUrl = url.trim()
    console.log("process-video-url: Processing URL:", trimmedUrl)
    
    const videoInfo = extractVideoInfo(trimmedUrl)

    if (!videoInfo) {
      console.error("process-video-url: Invalid video URL format:", trimmedUrl)
      return NextResponse.json({ error: "Invalid video URL format" }, { status: 400 })
    }

    console.log(`process-video-url: Extracted video info - Platform: ${videoInfo.platform}, ID: ${videoInfo.id}`)

    // Check for duplicates using our universal duplicate checker
    console.log("process-video-url: Checking for duplicates...")
    const duplicateCheck = await checkMediaDuplicate({ url: trimmedUrl })

    if (duplicateCheck.isDuplicate) {
      // Duplicate found - add extensive logging and safe data handling
      console.log("process-video-url: Duplicate video detected")
      console.log("process-video-url: Duplicate check result:", JSON.stringify(duplicateCheck, null, 2))
      
      // Ensure existingItem is safely handled
      const existingItem = duplicateCheck.existingItem
      const safeExistingItem = (existingItem && typeof existingItem === 'object') ? existingItem : null
      
      console.log("process-video-url: Safe existing item:", safeExistingItem)
      
      // Create a safe response object
      const safeResponse = {
        duplicate: true,
        existingVideo: safeExistingItem,
        message: duplicateCheck.reason || `Video already exists${safeExistingItem?.filename ? ` as "${safeExistingItem.filename}"` : ''}`,
        matchType: duplicateCheck.matchType || 'unknown',
      }
      
      console.log("process-video-url: Returning safe duplicate response:", JSON.stringify(safeResponse, null, 2))
      
      return NextResponse.json(safeResponse, { status: 200 })
    }

    console.log("process-video-url: No duplicate found, proceeding with new video processing")

    // Process based on platform
    let thumbnailUrl = null
    let videoTitle = null
    let uploadDate = null

    if (videoInfo.platform === "vimeo") {
      console.log("process-video-url: Processing Vimeo video")
      try {
        // Get video thumbnail and metadata from Vimeo
        const response = await fetch(`https://vimeo.com/api/v2/video/${videoInfo.id}.json`)
        if (response.ok) {
          const videoData = await response.json()
          const video = videoData[0]
          thumbnailUrl = video.thumbnail_large
          videoTitle = video.title || `Vimeo ${videoInfo.id}`
          uploadDate = video.upload_date ? new Date(video.upload_date).toISOString() : null
          console.log(`process-video-url: Vimeo metadata - Title: ${videoTitle}, Upload date: ${uploadDate}`)
        } else {
          console.warn(`process-video-url: Failed to fetch Vimeo metadata: ${response.status} ${response.statusText}`)
          thumbnailUrl = null
          videoTitle = `Vimeo Video ${videoInfo.id}`
        }
      } catch (error) {
        console.error("process-video-url: Error fetching Vimeo metadata:", error)
        thumbnailUrl = null
        videoTitle = `Vimeo Video ${videoInfo.id}`
      }
    } else if (videoInfo.platform === "youtube") {
      console.log("process-video-url: Processing YouTube video")
      thumbnailUrl = `https://img.youtube.com/vi/${videoInfo.id}/hqdefault.jpg`

      // Use YouTube Data API if available to get both title and upload date
      const apiKey = process.env.YOUTUBE_API_KEY
      if (apiKey && apiKey.trim() !== '') {
        console.log("process-video-url: YouTube Data API key found, attempting to fetch metadata")
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
              console.log(`process-video-url: YouTube Data API success - Title: ${videoTitle}, Upload date: ${uploadDate}`)
            } else {
              console.log("process-video-url: YouTube Data API returned no items, falling back to oEmbed")
              // Fall back to oEmbed API for title only
              const youtubeTitle = await fetchYouTubeTitle(videoInfo.id)
              videoTitle = youtubeTitle || `YouTube Video: ${videoInfo.id}`
            }
          } else {
            console.log(`process-video-url: YouTube Data API failed: ${response.status} ${response.statusText}`)
            if (response.status === 403) {
              console.log("process-video-url: YouTube API key may be invalid or quota exceeded")
            }
            // Fall back to oEmbed API for title only
            const youtubeTitle = await fetchYouTubeTitle(videoInfo.id)
            videoTitle = youtubeTitle || `YouTube Video: ${videoInfo.id}`
          }
        } catch (error) {
          console.error("process-video-url: Error fetching YouTube data from API:", error)
          // Fall back to oEmbed API for title only
          try {
            const youtubeTitle = await fetchYouTubeTitle(videoInfo.id)
            videoTitle = youtubeTitle || `YouTube Video: ${videoInfo.id}`
          } catch (oembedError) {
            console.error("process-video-url: Error fetching YouTube title from oEmbed:", oembedError)
            videoTitle = `YouTube Video: ${videoInfo.id}`
          }
        }
      } else {
        console.log("process-video-url: YouTube Data API key not found or empty - falling back to oEmbed for title only")
        console.log("process-video-url: Date extraction will be skipped for this video")
        // No API key available, use oEmbed API for title only
        try {
          const youtubeTitle = await fetchYouTubeTitle(videoInfo.id)
          videoTitle = youtubeTitle || `YouTube Video: ${videoInfo.id}`
          console.log(`process-video-url: oEmbed fallback success - Title: ${videoTitle}`)
        } catch (error) {
          console.error("process-video-url: Error fetching YouTube title:", error)
          videoTitle = `YouTube Video: ${videoInfo.id}`
        }
      }
    } else if (videoInfo.platform === "linkedin") {
      console.log("process-video-url: Processing LinkedIn video")
      thumbnailUrl = "/generic-icon.png"
      videoTitle = `LinkedIn Post ${videoInfo.id}`
    }

    // Validate that we have essential data before database insertion
    if (!videoTitle || videoTitle.trim() === '') {
      videoTitle = `${videoInfo.platform} Video ${videoInfo.id}`
      console.log(`process-video-url: Using fallback title: ${videoTitle}`)
    }

    // Validate required data before insertion
    if (!trimmedUrl || !videoTitle.trim()) {
      console.error("process-video-url: Missing required data for media insertion:", { url: trimmedUrl, videoTitle })
      return NextResponse.json({ error: "Missing required data for media insertion" }, { status: 400 })
    }

    console.log("process-video-url: Preparing database insertion...")
    console.log("process-video-url: Video metadata:", {
      title: videoTitle,
      platform: videoInfo.platform,
      id: videoInfo.id,
      thumbnailUrl,
      uploadDate,
      isBts
    })

    // Add to media library using admin client
    // Try both possible column names: file_path and filepath
    const baseMediaData = {
      filename: videoTitle,
      filesize: 0,
      filetype: videoInfo.platform,
      public_url: trimmedUrl,
      thumbnail_url: thumbnailUrl,
      tags: ["video", videoInfo.platform, ...(isBts ? ["bts"] : [])],
      metadata: {
        [videoInfo.platform + "Id"]: videoInfo.id,
        uploadedBy: "admin", // Since we're using the admin client
        isBts: isBts,
        uploadDate: uploadDate,
        originalUrl: trimmedUrl,
        title: videoTitle,
      },
    }

    console.log("process-video-url: Base media data prepared:", baseMediaData)

    // Try to insert with both filepath and file_path to handle different schema versions
    let data, error
    try {
      console.log("process-video-url: Attempting database insertion...")
      const insertData = {
        ...baseMediaData,
        filepath: trimmedUrl, // Primary attempt with filepath
        file_path: trimmedUrl, // Also include file_path for compatibility
      }
      
      console.log("process-video-url: Insert data:", insertData)
      
      const result = await supabase
        .from("media")
        .insert(insertData)
        .select()
      
      data = result.data
      error = result.error
      
      if (error) {
        console.error("process-video-url: Database insertion failed:", error)
      } else {
        console.log("process-video-url: Database insertion successful:", data)
      }
      
    } catch (insertError) {
      console.error("process-video-url: Insert exception:", insertError)
      error = insertError
    }

    if (error) {
      console.error("process-video-url: Error adding video to media library:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    console.log("process-video-url: Successfully processed new video")
    return NextResponse.json({
      success: true,
      url: trimmedUrl,
      thumbnailUrl,
      title: videoTitle,
      platform: videoInfo.platform,
      id: videoInfo.id,
      uploadDate,
      data,
    })
  } catch (error) {
    console.error("process-video-url: Unexpected error:", error)
    return NextResponse.json(
      { error: `Failed to process video URL: ${error instanceof Error ? error.message : String(error)}` },
      { status: 500 },
    )
  }
}
