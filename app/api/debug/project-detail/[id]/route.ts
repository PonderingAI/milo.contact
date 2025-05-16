import { NextResponse } from "next/server"
import { getProjectById, extractVideoInfo } from "@/lib/project-data"
import { createServerClient } from "@/lib/supabase-server"

export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const id = params.id

    // Get the project data
    const project = await getProjectById(id)

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 })
    }

    // Extract video info if available
    let extractedVideoInfo = null
    if (project.video_url) {
      extractedVideoInfo = extractVideoInfo(project.video_url)
    }

    // Get direct database info for comparison
    let dbInfo = null
    try {
      const supabase = createServerClient()
      const { data, error } = await supabase.from("projects").select("*").eq("id", id).single()

      if (!error && data) {
        dbInfo = {
          id: data.id,
          title: data.title,
          video_url: data.video_url,
          video_platform: data.video_platform,
          video_id: data.video_id,
        }
      }
    } catch (e) {
      console.error("Error fetching direct DB info:", e)
    }

    // Get BTS images directly
    let btsImages = []
    try {
      const supabase = createServerClient()
      const { data, error } = await supabase.from("bts_images").select("*").eq("project_id", id)

      if (!error && data) {
        btsImages = data
      }
    } catch (e) {
      console.error("Error fetching BTS images:", e)
    }

    // Return diagnostic information
    return NextResponse.json({
      project: {
        id: project.id,
        title: project.title,
        hasVideoUrl: !!project.video_url,
        videoUrl: project.video_url,
        hasVideoPlatform: !!project.video_platform,
        videoPlatform: project.video_platform,
        hasVideoId: !!project.video_id,
        videoId: project.video_id,
        btsImagesCount: project.bts_images?.length || 0,
        btsImages: project.bts_images?.map((img) => ({
          id: img.id,
          imageUrl: img.image_url,
          hasCaption: !!img.caption,
        })),
      },
      extractedVideoInfo,
      dbInfo,
      directBtsImages: {
        count: btsImages.length,
        images: btsImages.map((img) => ({
          id: img.id,
          imageUrl: img.image_url,
        })),
      },
    })
  } catch (error) {
    console.error("Error in debug endpoint:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
