import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Add the missing extractVideoInfo function
export function extractVideoInfo(url: string) {
  // YouTube
  const youtubeRegex = /(?:youtube\.com\/(?:[^/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?/\s]{11})/i
  const youtubeMatch = url.match(youtubeRegex)

  if (youtubeMatch && youtubeMatch[1]) {
    return {
      type: "youtube",
      id: youtubeMatch[1],
      url: `https://www.youtube.com/embed/${youtubeMatch[1]}`,
      thumbnail: `https://img.youtube.com/vi/${youtubeMatch[1]}/maxresdefault.jpg`,
    }
  }

  // Vimeo
  const vimeoRegex =
    /(?:vimeo\.com\/(?:channels\/(?:\w+\/)?|groups\/(?:[^/]*)\/videos\/|album\/(?:\d+)\/video\/|)(\d+)(?:$|\/|\?))/i
  const vimeoMatch = url.match(vimeoRegex)

  if (vimeoMatch && vimeoMatch[1]) {
    return {
      type: "vimeo",
      id: vimeoMatch[1],
      url: `https://player.vimeo.com/video/${vimeoMatch[1]}`,
      thumbnail: "", // Vimeo requires API call to get thumbnail
    }
  }

  // If no match found
  return null
}
