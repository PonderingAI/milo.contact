/**
 * Project Data Utilities
 *
 * This file contains types and client-safe utility functions for working with project data.
 * Server-side data fetching functions are in project-data-server.ts
 */

import { mockProjects, mockBtsImages, type Project, type BtsImage } from "./mock-data"

// Re-export types for backward compatibility
export type { Project, BtsImage }

// Re-export mock data for backward compatibility
export { mockProjects, mockBtsImages }

/**
 * Check if a string is a valid UUID
 */
export function isValidUUID(id: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
  return uuidRegex.test(id)
}

/**
 * Extract tags from role field
 */
export function extractTagsFromRole(role: string | null | undefined): string[] {
  if (!role) return []
  return role
    .split(",")
    .map((tag) => tag.trim())
    .filter(Boolean)
}

/**
 * Extract video platform and ID from a video URL
 */
export function extractVideoInfo(url: string): { platform: string; id: string } | null {
  try {
    if (!url || typeof url !== "string") {
      console.error("Invalid video URL:", url)
      return null
    }

    // Clean up the URL and remove fragments
    const cleanUrl = url.trim().split('#')[0]

    // YouTube URL patterns - Updated to handle various query parameters and formats
    const youtubePatterns = [
      // Standard watch URLs with various query parameters
      /(?:https?:\/\/)?(?:www\.)?youtube\.com\/watch\?(?:[^&]*&)*v=([a-zA-Z0-9_-]{11})(?:&[^&]*)*$/i,
      /(?:https?:\/\/)?(?:www\.)?youtube\.com\/watch\?v=([a-zA-Z0-9_-]{11})(?:[&?].*)?$/i,
      // Embed URLs with query parameters 
      /(?:https?:\/\/)?(?:www\.)?youtube\.com\/embed\/([a-zA-Z0-9_-]{11})(?:\?.*)?$/i,
      /(?:https?:\/\/)?(?:www\.)?youtube-nocookie\.com\/embed\/([a-zA-Z0-9_-]{11})(?:\?.*)?$/i,
      // Short URLs
      /(?:https?:\/\/)?(?:www\.)?youtu\.be\/([a-zA-Z0-9_-]{11})(?:\?.*)?$/i,
      // Live URLs
      /(?:https?:\/\/)?(?:www\.)?youtube\.com\/live\/([a-zA-Z0-9_-]{11})(?:\?.*)?$/i,
      // Shorts URLs
      /(?:https?:\/\/)?(?:www\.)?youtube\.com\/shorts\/([a-zA-Z0-9_-]{11})(?:\?.*)?$/i,
    ]

    // Vimeo URL patterns - Updated to handle query parameters properly
    const vimeoPatterns = [
      // Player embed URLs with query parameters (like the problematic URL)
      /(?:https?:\/\/)?(?:www\.)?player\.vimeo\.com\/video\/(\d+)(?:\?.*)?$/i,
      // Standard vimeo.com URLs
      /(?:https?:\/\/)?(?:www\.)?vimeo\.com\/(\d+)(?:[/?].*)?$/i,
      // Private/unlisted URLs
      /(?:https?:\/\/)?(?:www\.)?vimeo\.com\/(\d+)\/[a-zA-Z0-9]+(?:\?.*)?$/i,
    ]

    // LinkedIn URL patterns - Improved for various formats
    const linkedinPatterns = [
      // Activity URLs
      /(?:https?:\/\/)?(?:www\.)?linkedin\.com\/feed\/update\/urn:li:activity:([0-9a-zA-Z-]+)(?:\?.*)?$/i,
      // Posts URLs  
      /(?:https?:\/\/)?(?:www\.)?linkedin\.com\/posts\/[^/]+-([0-9a-zA-Z-]+)(?:\?.*)?$/i,
      // Company posts
      /(?:https?:\/\/)?(?:www\.)?linkedin\.com\/company\/[^/]+\/posts\/([0-9a-zA-Z-]+)(?:\?.*)?$/i,
    ]

    // Check YouTube patterns
    for (const pattern of youtubePatterns) {
      const match = cleanUrl.match(pattern)
      if (match && match[1]) {
        // Validate YouTube video ID (should be 11 characters)
        if (match[1].length === 11) {
          return { platform: "youtube", id: match[1] }
        }
      }
    }

    // Check Vimeo patterns
    for (const pattern of vimeoPatterns) {
      const match = cleanUrl.match(pattern)
      if (match && match[1]) {
        // Validate Vimeo video ID (should be numeric)
        if (/^\d+$/.test(match[1])) {
          return { platform: "vimeo", id: match[1] }
        }
      }
    }

    // Check LinkedIn patterns
    for (const pattern of linkedinPatterns) {
      const match = cleanUrl.match(pattern)
      if (match && match[1]) {
        return { platform: "linkedin", id: match[1] }
      }
    }

    console.warn("Unrecognized video URL format:", url)
    return null
  } catch (error) {
    console.error("Error extracting video info:", error)
    return null
  }
}

// Add this new function to fetch YouTube video titles using the oEmbed API
export async function fetchYouTubeTitle(videoId: string): Promise<string | null> {
  try {
    console.log(`fetchYouTubeTitle: Fetching title for video ID: ${videoId}`)
    const response = await fetch(
      `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`,
    )

    if (!response.ok) {
      console.log(`fetchYouTubeTitle: oEmbed API request failed: ${response.status} ${response.statusText}`)
      return null
    }

    const data = await response.json()
    const title = data.title || null
    console.log(`fetchYouTubeTitle: Successfully fetched title: ${title}`)
    return title
  } catch (error) {
    console.error("fetchYouTubeTitle: Error fetching YouTube title:", error)
    return null
  }
}

/**
 * Extract video release date from YouTube or Vimeo
 */
export async function extractVideoDate(url: string): Promise<Date | null> {
  try {
    const videoInfo = extractVideoInfo(url)
    if (!videoInfo) {
      console.log("extractVideoDate: Invalid video URL provided:", url)
      return null
    }

    console.log(`extractVideoDate: Processing ${videoInfo.platform} video with ID: ${videoInfo.id}`)

    if (videoInfo.platform === "youtube") {
      const apiKey = process.env.YOUTUBE_API_KEY
      if (!apiKey || apiKey.trim() === '') {
        console.log("extractVideoDate: YouTube Data API key not found or empty - date extraction will be skipped")
        console.log("extractVideoDate: To enable date extraction, set the YOUTUBE_API_KEY environment variable")
        return null
      }
      
      console.log("extractVideoDate: Using YouTube Data API v3 to fetch video date")
      
      try {
        const response = await fetch(
          `https://www.googleapis.com/youtube/v3/videos?id=${videoInfo.id}&part=snippet&key=${apiKey}`
        )
        
        if (response.ok) {
          const data = await response.json()
          if (data.items && data.items.length > 0) {
            const publishedAt = data.items[0].snippet.publishedAt
            if (publishedAt) {
              console.log(`extractVideoDate: Successfully extracted YouTube video date: ${publishedAt}`)
              return new Date(publishedAt)
            }
          } else {
            console.log("extractVideoDate: No video data found in YouTube API response")
          }
        } else {
          console.log(`extractVideoDate: YouTube Data API request failed: ${response.status} ${response.statusText}`)
          if (response.status === 403) {
            console.log("extractVideoDate: YouTube API key may be invalid or quota exceeded")
          }
        }
      } catch (apiError) {
        console.error("extractVideoDate: Error calling YouTube Data API:", apiError)
      }
    } else if (videoInfo.platform === "vimeo") {
      console.log("extractVideoDate: Using Vimeo API v2 to fetch video date")
      
      try {
        // Use Vimeo API v2 to get upload date
        const response = await fetch(`https://vimeo.com/api/v2/video/${videoInfo.id}.json`)
        if (response.ok) {
          const videoData = await response.json()
          const video = videoData[0]
          if (video && video.upload_date) {
            console.log(`extractVideoDate: Successfully extracted Vimeo video date: ${video.upload_date}`)
            return new Date(video.upload_date)
          }
        } else {
          console.log(`extractVideoDate: Vimeo API request failed: ${response.status} ${response.statusText}`)
        }
      } catch (vimeoError) {
        console.error("extractVideoDate: Error calling Vimeo API:", vimeoError)
      }
    }

    console.log("extractVideoDate: No date could be extracted for this video")
    return null
  } catch (error) {
    console.error("extractVideoDate: Unexpected error:", error)
    return null
  }
}


