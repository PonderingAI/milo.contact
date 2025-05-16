import { NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase-server"
import { extractVideoInfo } from "@/lib/project-data"

export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const id = params.id

    const supabase = createServerClient()

    // Get the project
    const { data: project, error: projectError } = await supabase.from("projects").select("*").eq("id", id).single()

    if (projectError) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 })
    }

    // Process video URL if present
    if (project.video_url && (!project.video_platform || !project.video_id)) {
      const videoInfo = extractVideoInfo(project.video_url)
      if (videoInfo) {
        project.video_platform = videoInfo.platform
        project.video_id = videoInfo.id
      }
    }

    // Get BTS images
    const { data: btsImages, error: btsError } = await supabase
      .from("bts_images")
      .select("*")
      .eq("project_id", id)
      .order("created_at", { ascending: true })

    if (btsError) {
      console.error("Error fetching BTS images:", btsError)
    }

    // Return the project with BTS images
    return NextResponse.json({
      ...project,
      bts_images: btsImages || [],
    })
  } catch (error) {
    console.error("Error fetching project:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
