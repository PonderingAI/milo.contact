import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { isAdmin } from "@/lib/auth-utils"

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL || ""
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ""
const supabase = createClient(supabaseUrl, supabaseServiceKey)

export async function POST(request: NextRequest) {
  try {
    // Check if user is admin
    const adminCheck = await isAdmin()
    if (!adminCheck.isAdmin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { projectId, images } = await request.json()

    if (!projectId) {
      return NextResponse.json({ error: "Project ID is required" }, { status: 400 })
    }

    if (!images || !Array.isArray(images)) {
      return NextResponse.json({ error: "Images array is required" }, { status: 400 })
    }

    // Check if the project exists
    const { data: project, error: projectError } = await supabase
      .from("projects")
      .select("id")
      .eq("id", projectId)
      .single()

    if (projectError || !project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 })
    }

    // Delete existing BTS images for this project
    const { error: deleteError } = await supabase.from("bts_images").delete().eq("project_id", projectId)

    if (deleteError) {
      console.error("Error deleting existing BTS images:", deleteError)
      return NextResponse.json({ error: "Failed to update BTS images" }, { status: 500 })
    }

    // Insert new BTS images
    if (images.length > 0) {
      const btsImagesData = images.map((image: any) => ({
        project_id: projectId,
        url: image.url,
        is_video: image.is_video || false,
        created_at: new Date().toISOString(),
      }))

      const { error: insertError } = await supabase.from("bts_images").insert(btsImagesData)

      if (insertError) {
        console.error("Error inserting BTS images:", insertError)
        return NextResponse.json({ error: "Failed to save BTS images" }, { status: 500 })
      }
    }

    return NextResponse.json({ success: true, message: "BTS images saved successfully" })
  } catch (error) {
    console.error("Error in BTS images API:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    // Extract project ID from URL
    const url = new URL(request.url)
    const pathParts = url.pathname.split("/")
    const projectId = pathParts[pathParts.length - 1]

    if (!projectId || projectId === "bts-images") {
      return NextResponse.json({ error: "Project ID is required" }, { status: 400 })
    }

    // Fetch BTS images for the project
    const { data: images, error } = await supabase
      .from("bts_images")
      .select("*")
      .eq("project_id", projectId)
      .order("created_at", { ascending: true })

    if (error) {
      console.error("Error fetching BTS images:", error)
      return NextResponse.json({ error: "Failed to fetch BTS images" }, { status: 500 })
    }

    return NextResponse.json({ images })
  } catch (error) {
    console.error("Error in BTS images API:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
