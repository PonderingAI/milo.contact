import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  try {
    // Get the videoId from the query parameters
    const videoId = request.nextUrl.searchParams.get("videoId")

    if (!videoId) {
      return NextResponse.json({ error: "Missing videoId parameter" }, { status: 400 })
    }

    // Use the oEmbed API to get the video title
    const response = await fetch(
      `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`,
    )

    if (!response.ok) {
      return NextResponse.json(
        { error: `Failed to fetch YouTube title: ${response.status} ${response.statusText}` },
        { status: response.status },
      )
    }

    const data = await response.json()

    const jsonResponse = NextResponse.json({
      title: data.title || null,
      author: data.author_name || null,
      thumbnailUrl: data.thumbnail_url || null,
    })
    
    // Cache YouTube metadata for 1 hour since video info doesn't change frequently
    jsonResponse.headers.set('Cache-Control', 'public, max-age=3600, s-maxage=3600')
    
    return jsonResponse
  } catch (error) {
    console.error("Error fetching YouTube title:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error occurred" },
      { status: 500 },
    )
  }
}
