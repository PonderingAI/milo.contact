import { type NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase-server"
import { checkUserIsAdmin } from "@/lib/server-auth-utils"

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const supabase = createServerClient()

    // Get the project
    const { data: project, error: projectError } = await supabase
      .from("projects")
      .select("*")
      .eq("id", params.id)
      .single()

    if (projectError) {
      console.error("Error fetching project:", projectError)
      return NextResponse.json({ error: "Failed to fetch project" }, { status: 500 })
    }

    // Get BTS images for the project
    const { data: btsImages, error: btsError } = await supabase
      .from("bts_images")
      .select("*")
      .eq("project_id", params.id)
      .order("created_at", { ascending: true })

    if (btsError) {
      console.error("Error fetching BTS images:", btsError)
      // Continue without BTS images
    }

    // Return the project with BTS images
    return NextResponse.json({
      project: {
        ...project,
        bts_images: btsImages || [],
      },
    })
  } catch (error) {
    console.error("Error in project API:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const supabase = createServerClient()

    // Check if user is admin
    const isAdmin = await checkUserIsAdmin()
    if (!isAdmin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Delete BTS images first (to avoid foreign key constraints)
    const { error: btsDeleteError } = await supabase.from("bts_images").delete().eq("project_id", params.id)

    if (btsDeleteError) {
      console.error("Error deleting BTS images:", btsDeleteError)
      return NextResponse.json({ error: "Failed to delete BTS images" }, { status: 500 })
    }

    // Delete the project
    const { error: projectDeleteError } = await supabase.from("projects").delete().eq("id", params.id)

    if (projectDeleteError) {
      console.error("Error deleting project:", projectDeleteError)
      return NextResponse.json({ error: "Failed to delete project" }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error in project delete API:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
