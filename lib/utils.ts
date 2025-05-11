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

export function extractVideoInfo(url: string | undefined) {
  if (!url) return null

  // YouTube
  if (url.includes("youtube.com") || url.includes("youtu.be")) {
    const regex = /(?:youtube\.com\/(?:[^/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?/\s]{11})/
    const match = url.match(regex)
    return match ? { platform: "youtube", id: match[1] } : null
  }

  // Vimeo
  if (url.includes("vimeo.com")) {
    const regex =
      /vimeo\.com\/(?:channels\/(?:\w+\/)?|groups\/(?:[^/]*)\/videos\/|album\/(?:\d+)\/video\/|)(\d+)(?:$|\/|\?)/
    const match = url.match(regex)
    return match ? { platform: "vimeo", id: match[1] } : null
  }

  // LinkedIn
  if (url.includes("linkedin.com")) {
    const regex = /linkedin\.com\/(?:posts|feed\/update)\/(?:urn:li:activity:)?(\d+)/
    const match = url.match(regex)
    return match ? { platform: "linkedin", id: match[1] } : null
  }

  return null
}
