import { NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase-server"
import { extractVideoInfo } from "@/lib/project-data"

export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const id = params.id

    if (!id) {
      return NextResponse.json({ error: "Project ID is required" }, { status: 400 })
    }

    const supabase = createServerClient()

    // Fetch the project
    const { data: project, error: projectError } = await supabase.from("projects").select("*").eq("id", id).single()

    if (projectError) {
      console.error("Error fetching project:", projectError)
      return NextResponse.json({ error: projectError.message }, { status: 500 })
    }

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 })
    }

    // Fetch BTS images
    const { data: btsImages, error: btsError } = await supabase
      .from("bts_images")
      .select("*")
      .eq("project_id", id)
      .order("created_at", { ascending: true })

    if (btsError) {
      console.error("Error fetching BTS images:", btsError)
      // Continue anyway, we'll just show that there was an error
    }

    // Extract video info from thumbnail_url if present
    let videoInfo = null
    if (project.thumbnail_url) {
      videoInfo = extractVideoInfo(project.thumbnail_url)
    }

    // Create an enhanced project object with derived fields
    const enhancedProject = {
      ...project,
      video_url: project.video_url || project.thumbnail_url, // Check both fields
      video_platform: videoInfo?.platform || project.video_platform,
      video_id: videoInfo?.id || project.video_id,
      bts_images: btsImages || [],
      _debug: {
        btsImagesCount: btsImages?.length || 0,
        btsImagesError: btsError ? btsError.message : null,
        videoInfoExtracted: !!videoInfo,
        hasVideoUrl: !!project.video_url,
        hasThumbnailUrl: !!project.thumbnail_url,
      },
    }

    return NextResponse.json(enhancedProject)
  } catch (error) {
    console.error("Error in project detail debug API:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error occurred" },
      { status: 500 },
    )
  }
}
