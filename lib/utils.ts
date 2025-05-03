import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Format a file size in bytes to a human-readable string
 * @param bytes File size in bytes
 * @returns Formatted string (e.g., "1.5 MB")
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 Bytes"

  const k = 1024
  const sizes = ["Bytes", "KB", "MB", "GB", "TB"]
  const i = Math.floor(Math.log(bytes) / Math.log(k))

  return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
}

/**
 * Extract video ID from various video platform URLs
 * @param url The video URL
 * @returns Object containing platform and videoId
 */
export function extractVideoInfo(url: string): {
  platform: "youtube" | "vimeo" | "linkedin" | null
  videoId: string | null
} {
  // YouTube regex patterns
  const youtubeRegex = /(?:youtube\.com\/(?:[^/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?/\s]{11})/i
  const youtubeMatch = url.match(youtubeRegex)

  if (youtubeMatch && youtubeMatch[1]) {
    return { platform: "youtube", videoId: youtubeMatch[1] }
  }

  // Vimeo regex pattern
  const vimeoRegex =
    /(?:vimeo\.com\/(?:channels\/(?:\w+\/)?|groups\/(?:[^/]*)\/videos\/|album\/(?:\d+)\/video\/|)(\d+)(?:$|\/|\?))/i
  const vimeoMatch = url.match(vimeoRegex)

  if (vimeoMatch && vimeoMatch[1]) {
    return { platform: "vimeo", videoId: vimeoMatch[1] }
  }

  // LinkedIn regex pattern
  const linkedinRegex = /linkedin\.com\/.*(?:posts|video).*(?:\/|\?)([0-9]+)/i
  const linkedinMatch = url.match(linkedinRegex)

  if (linkedinMatch && linkedinMatch[1]) {
    return { platform: "linkedin", videoId: linkedinMatch[1] }
  }

  return { platform: null, videoId: null }
}
