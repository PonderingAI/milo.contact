import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 Bytes"

  const k = 1024
  const sizes = ["Bytes", "KB", "MB", "GB", "TB"]
  const i = Math.floor(Math.log(bytes) / Math.log(k))

  return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
}

/**
 * Extract video platform and ID from a video URL
 * Supports various YouTube and Vimeo URL formats
 * @param url Video URL from YouTube, Vimeo, or LinkedIn
 * @returns Object with platform and id, or null if not recognized
 */
export function extractVideoInfo(url: string): { platform: string; id: string } | null {
  if (!url || typeof url !== "string") {
    console.error("Invalid video URL:", url)
    return null
  }

  console.log("Extracting video info from:", url)

  // YouTube URL patterns
  const youtubePatterns = [
    // Standard watch URLs
    /(?:https?:\/\/)?(?:www\.)?youtube\.com\/watch\?v=([^&]+)/i,

    // Short URLs
    /(?:https?:\/\/)?(?:www\.)?youtu\.be\/([^?]+)/i,

    // Embed URLs (both regular and nocookie)
    /(?:https?:\/\/)?(?:www\.)?youtube\.com\/embed\/([^?/]+)/i,
    /(?:https?:\/\/)?(?:www\.)?youtube-nocookie\.com\/embed\/([^?/]+)/i,

    // Share URLs
    /(?:https?:\/\/)?(?:www\.)?youtube\.com\/shorts\/([^?/]+)/i,

    // Handle URLs with time parameters
    /(?:https?:\/\/)?(?:www\.)?youtube\.com\/watch\?(?:.+&)?v=([^&]+)(?:&|$)/i,
  ]

  // Vimeo URL patterns
  const vimeoPatterns = [
    // Standard URLs
    /(?:https?:\/\/)?(?:www\.)?vimeo\.com\/(\d+)(?:[?/].*)?$/i,

    // Player URLs
    /(?:https?:\/\/)?(?:www\.)?player\.vimeo\.com\/video\/(\d+)(?:[?/].*)?$/i,

    // App URLs
    /(?:https?:\/\/)?(?:www\.)?vimeo\.com\/(?:channels\/[^/]+\/|groups\/[^/]+\/videos\/|album\/\d+\/video\/|)(\d+)(?:[?/].*)?$/i,

    // Event URLs
    /(?:https?:\/\/)?(?:www\.)?vimeo\.com\/event\/(\d+)(?:[?/].*)?$/i,
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
      console.log("YouTube video ID:", match[1])
      return { platform: "youtube", id: match[1] }
    }
  }

  // Check Vimeo patterns
  for (const pattern of vimeoPatterns) {
    const match = url.match(pattern)
    if (match && match[1]) {
      console.log("Vimeo video ID:", match[1])
      return { platform: "vimeo", id: match[1] }
    }
  }

  // Check LinkedIn patterns
  for (const pattern of linkedinPatterns) {
    const match = url.match(pattern)
    if (match && match[1]) {
      console.log("LinkedIn video ID:", match[1])
      return { platform: "linkedin", id: match[1] }
    }
  }

  // If we get here, try to extract YouTube video ID from query parameters
  try {
    const urlObj = new URL(url)
    if (urlObj.hostname.includes("youtube.com") || urlObj.hostname.includes("youtu.be")) {
      const videoId = urlObj.searchParams.get("v")
      if (videoId) {
        console.log("YouTube video ID from query params:", videoId)
        return { platform: "youtube", id: videoId }
      }
    }
  } catch (e) {
    // URL parsing failed, continue with other methods
  }

  console.warn("Unrecognized video URL format:", url)
  return null
}
