import { NextResponse } from "next/server"
import { getSupabaseServerClient } from "@/lib/supabase-server"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const url = searchParams.get("url")

    if (!url) {
      return NextResponse.json({ error: "URL parameter is required" }, { status: 400 })
    }

    const supabase = getSupabaseServerClient()

    // Check if the URL exists in the media table
    const { data: mediaItem, error: mediaError } = await supabase
      .from("media")
      .select("*")
      .eq("public_url", url)
      .maybeSingle()

    if (mediaError) {
      return NextResponse.json({ error: mediaError.message }, { status: 500 })
    }

    // Try to fetch the image to check if it's accessible
    let imageAccessible = false
    let imageError = null

    try {
      const imageResponse = await fetch(url, { method: "HEAD" })
      imageAccessible = imageResponse.ok
      if (!imageAccessible) {
        imageError = `Status: ${imageResponse.status} ${imageResponse.statusText}`
      }
    } catch (error) {
      imageAccessible = false
      imageError = error instanceof Error ? error.message : "Unknown error"
    }

    return NextResponse.json({
      url,
      mediaItem,
      imageAccessible,
      imageError,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error("Error in media preview debug endpoint:", error)
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unknown error" }, { status: 500 })
  }
}
