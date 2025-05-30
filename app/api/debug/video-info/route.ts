import { NextResponse } from "next/server"
import { extractVideoInfo } from "@/lib/project-data"

export async function GET(request: Request) {
  try {
    const url = new URL(request.url)
    const videoUrl = url.searchParams.get("url")

    if (!videoUrl) {
      return NextResponse.json({ error: "Missing video URL parameter" }, { status: 400 })
    }

    const videoInfo = extractVideoInfo(videoUrl)

    if (!videoInfo) {
      return NextResponse.json(
        {
          success: false,
          message: "Could not extract video information from the provided URL",
          url: videoUrl,
        },
        { status: 200 },
      )
    }

    // For YouTube videos, try to fetch the title
    let title = null
    if (videoInfo.platform === "youtube") {
      try {
        const response = await fetch(
          `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoInfo.id}&format=json`,
        )
        if (response.ok) {
          const data = await response.json()
          title = data.title
        }
      } catch (error) {
        console.error("Error fetching YouTube title:", error)
      }
    }

    // For Vimeo videos, try to fetch metadata
    let vimeoMetadata = null
    if (videoInfo.platform === "vimeo") {
      try {
        const response = await fetch(`https://vimeo.com/api/v2/video/${videoInfo.id}.json`)
        if (response.ok) {
          vimeoMetadata = await response.json()
        }
      } catch (error) {
        console.error("Error fetching Vimeo metadata:", error)
      }
    }

    return NextResponse.json({
      success: true,
      url: videoUrl,
      info: videoInfo,
      title,
      vimeoMetadata: vimeoMetadata ? vimeoMetadata[0] : null,
      embedUrl:
        videoInfo.platform === "youtube"
          ? `https://www.youtube.com/embed/${videoInfo.id}`
          : videoInfo.platform === "vimeo"
            ? `https://player.vimeo.com/video/${videoInfo.id}`
            : null,
    })
  } catch (error) {
    console.error("Error in video info API:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error occurred" },
      { status: 500 },
    )
  }
}
