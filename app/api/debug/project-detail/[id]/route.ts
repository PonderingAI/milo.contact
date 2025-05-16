import { type NextRequest, NextResponse } from "next/server"
import { getProjectById } from "@/lib/project-data"

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    // Get the project using the utility function
    const project = await getProjectById(params.id)

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 })
    }

    // Return detailed information about the project for debugging
    return NextResponse.json({
      project,
      debug: {
        hasVideoUrl: !!project.video_url,
        hasVideoPlatform: !!project.video_platform,
        hasVideoId: !!project.video_id,
        btsImagesCount: project.bts_images?.length || 0,
        extractedVideoInfo: project.video_url ? extractVideoInfo(project.video_url) : null,
      },
    })
  } catch (error) {
    console.error("Error in debug project API:", error)
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    )
  }
}

// Helper function to extract video info
function extractVideoInfo(url: string): { platform: string; id: string } | null {
  try {
    if (!url || typeof url !== "string") {
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

    return null
  } catch (error) {
    console.error("Error extracting video info:", error)
    return null
  }
}
