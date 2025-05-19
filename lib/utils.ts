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
 * @param url Video URL from YouTube, Vimeo, or LinkedIn
 * @returns Object with platform and id, or null if not recognized
 */
export function extractVideoInfo(url: string): { platform: string; id: string } | null {
  if (!url || typeof url !== "string") {
    console.error("Invalid video URL:", url)
    return null
  }

  console.log("Extracting video info from:", url)

  // Simple regex patterns for common video URLs
  // YouTube
  const youtubeMatch = url.match(
    /(?:youtube\.com\/(?:[^/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?/\s]{11})/i,
  )
  if (youtubeMatch && youtubeMatch[1]) {
    console.log("YouTube video ID:", youtubeMatch[1])
    return { platform: "youtube", id: youtubeMatch[1] }
  }

  // Vimeo
  const vimeoMatch = url.match(/(?:vimeo\.com\/|player\.vimeo\.com\/video\/)(\d+)/i)
  if (vimeoMatch && vimeoMatch[1]) {
    console.log("Vimeo video ID:", vimeoMatch[1])
    return { platform: "vimeo", id: vimeoMatch[1] }
  }

  console.warn("Unrecognized video URL format:", url)
  return null
}
