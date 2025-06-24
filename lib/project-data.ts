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
      /(?:https?:\/\/)?(?:www\.)?linkedin\.com\/feed\/update\/urn:li:activity:([0-9a-zA-Z-]+)/i,
      /(?:https?:\/\/)?(?:www\.)?linkedin\.com\/posts\/[^/]+-([0-9a-zA-Z-]+)/i,
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

    // Check LinkedIn patterns
    for (const pattern of linkedinPatterns) {
      const match = url.match(pattern)
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
    const response = await fetch(
      `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`,
    )

    if (!response.ok) {
      console.error(`Failed to fetch YouTube title: ${response.status} ${response.statusText}`)
      return null
    }

    const data = await response.json()
    return data.title || null
  } catch (error) {
    console.error("Error fetching YouTube title:", error)
    return null
  }
}

/**
 * Extract video release date from YouTube or Vimeo
 */
export async function extractVideoDate(url: string): Promise<Date | null> {
  try {
    const videoInfo = extractVideoInfo(url)
    if (!videoInfo) return null

    if (videoInfo.platform === "youtube") {
      const apiKey = process.env.YOUTUBE_API_KEY
      if (!apiKey) {
        console.warn("YouTube API key not configured")
        return null
      }
      
      const response = await fetch(
        `https://www.googleapis.com/youtube/v3/videos?id=${videoInfo.id}&part=snippet&key=${apiKey}`
      )
      
      if (response.ok) {
        const data = await response.json()
        if (data.items && data.items.length > 0) {
          const publishedAt = data.items[0].snippet.publishedAt
          if (publishedAt) {
            return new Date(publishedAt)
          }
        }
      }
    } else if (videoInfo.platform === "vimeo") {
      // Use Vimeo API v2 to get upload date
      const response = await fetch(`https://vimeo.com/api/v2/video/${videoInfo.id}.json`)
      if (response.ok) {
        const videoData = await response.json()
        const video = videoData[0]
        if (video.upload_date) {
          return new Date(video.upload_date)
        }
      }
    }

    return null
  } catch (error) {
    console.error("Error extracting video date:", error)
    return null
  }
}


