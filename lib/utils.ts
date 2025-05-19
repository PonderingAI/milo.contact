import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Extracts platform and video ID from a video URL
 * @param url Video URL from YouTube, Vimeo, or LinkedIn
 * @returns Object with platform and id, or null if not recognized
 */
export function extractVideoInfo(url: string): { platform: string; id: string } | null {
  if (!url) return null

  console.log("Extracting video info from:", url)

  // YouTube
  const youtubeRegex = /(?:youtube\.com\/(?:[^/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?/\s]{11})/i
  const youtubeMatch = url.match(youtubeRegex)

  if (youtubeMatch && youtubeMatch[1]) {
    console.log("YouTube video ID:", youtubeMatch[1])
    return { platform: "youtube", id: youtubeMatch[1] }
  }

  // Vimeo
  const vimeoRegex = /(?:vimeo\.com\/(?:video\/)?|player\.vimeo\.com\/video\/)(\d+)/i
  const vimeoMatch = url.match(vimeoRegex)

  if (vimeoMatch && vimeoMatch[1]) {
    console.log("Vimeo video ID:", vimeoMatch[1])
    return { platform: "vimeo", id: vimeoMatch[1] }
  }

  // LinkedIn
  const linkedinRegex = /linkedin\.com\/posts\/.*(?:\?|&)videoId=(\d+)/i
  const linkedinMatch = url.match(linkedinRegex)

  if (linkedinMatch && linkedinMatch[1]) {
    console.log("LinkedIn video ID:", linkedinMatch[1])
    return { platform: "linkedin", id: linkedinMatch[1] }
  }

  console.log("No video ID found in URL")
  return null
}

/**
 * Formats a date string in a human-readable format
 * @param dateString ISO date string
 * @returns Formatted date string
 */
export function formatDate(dateString: string): string {
  if (!dateString) return ""

  const date = new Date(dateString)

  // Check if date is valid
  if (isNaN(date.getTime())) return ""

  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  })
}

/**
 * Truncates text to a specified length and adds ellipsis
 * @param text Text to truncate
 * @param maxLength Maximum length before truncation
 * @returns Truncated text
 */
export function truncateText(text: string, maxLength: number): string {
  if (!text || text.length <= maxLength) return text
  return text.slice(0, maxLength) + "..."
}
