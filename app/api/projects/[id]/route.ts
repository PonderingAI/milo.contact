import { NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase-server"
import { extractVideoInfo } from "@/lib/project-data"

export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const id = params.id

    // Check if the ID is a valid UUID
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
    const isValidUUID = uuidRegex.test(id)

    // If not a valid UUID, return mock data if available
    if (!isValidUUID) {
      // Import mock data dynamically to avoid circular dependencies
      const { mockProjects, mockBtsImages } = await import("@/lib/project-data")

      const mockProject = mockProjects.find((p) => p.id === id)
      if (mockProject) {
        // Process video URL if present
        if (mockProject.video_url && (!mockProject.video_platform || !mockProject.video_id)) {
          const videoInfo = extractVideoInfo(mockProject.video_url)
          if (videoInfo) {
            mockProject.video_platform = videoInfo.platform
            mockProject.video_id = videoInfo.id
          }
        }

        return NextResponse.json({
          ...mockProject,
          bts_images: mockBtsImages.filter((img) => img.project_id === id),
        })
      }

      return NextResponse.json({ error: "Project not found" }, { status: 404 })
    }

    const supabase = createServerClient()

    // Get the project
    const { data: project, error: projectError } = await supabase.from("projects").select("*").eq("id", id).single()

    if (projectError) {
      if (projectError.code === "PGRST116") {
        return NextResponse.json({ error: "Project not found" }, { status: 404 })
      }
      return NextResponse.json({ error: "Error fetching project" }, { status: 500 })
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
