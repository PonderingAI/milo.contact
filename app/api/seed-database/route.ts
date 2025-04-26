import { createServerClient } from "@/lib/supabase"
import { NextResponse } from "next/server"

export async function POST() {
  try {
    const supabase = createServerClient()

    // Check if tables exist
    const { error: checkError } = await supabase.from("projects").select("count(*)", { count: "exact", head: true })

    if (checkError) {
      return NextResponse.json(
        { success: false, message: `Tables not created yet: ${checkError.message}` },
        { status: 500 },
      )
    }

    // Insert sample projects
    const { error: projectsError } = await supabase.from("projects").insert([
      {
        id: "directed-1",
        title: "Short Film Title",
        category: "Short Film",
        type: "directed",
        role: "Director",
        image: "/images/project1.jpg",
        video_url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
        description: "A compelling short film exploring themes of identity and belonging in a post-digital world.",
        special_notes:
          "This project was particularly special because we shot it entirely during golden hour over three consecutive days, creating a consistent and dreamlike visual atmosphere.",
      },
      {
        id: "directed-2",
        title: "Music Video Project",
        category: "Music Video",
        type: "directed",
        role: "Director",
        image: "/images/project2.jpg",
        video_url: "https://vimeo.com/123456789",
        description: "An experimental music video featuring innovative visual techniques and storytelling.",
        special_notes:
          "Working with the artist to develop a visual language that complemented the music was a rewarding creative challenge.",
      },
      {
        id: "camera-1",
        title: "Feature Film",
        category: "Feature Film",
        type: "camera",
        role: "1st AC",
        image: "/images/project5.jpg",
        video_url: "https://youtube.com/watch?v=i_HtDNSxCnE",
        description: "Worked as 1st AC on this award-winning feature film, managing focus and camera operations.",
        special_notes:
          "The challenging lighting conditions and complex camera movements made this project particularly rewarding.",
      },
      {
        id: "camera-2",
        title: "TV Series",
        category: "Television",
        type: "camera",
        role: "2nd AC",
        image: "/images/project6.jpg",
        video_url: "https://www.youtube.com/watch?v=lmnopqrstuv",
        description: "Served as 2nd AC for this popular TV series, handling equipment and supporting the camera team.",
        special_notes: "Working with a seasoned DP taught me invaluable lessons about lighting and composition.",
      },
    ])

    if (projectsError) {
      return NextResponse.json(
        { success: false, message: `Error seeding projects: ${projectsError.message}` },
        { status: 500 },
      )
    }

    // Insert sample BTS images
    const { error: btsError } = await supabase.from("bts_images").insert([
      {
        id: "bts-1",
        project_id: "directed-1",
        image_url: "/images/bts/directed-1-1.jpg",
        caption: "Setting up the camera rig",
        size: "medium",
        aspect_ratio: "landscape",
      },
      {
        id: "bts-2",
        project_id: "directed-1",
        image_url: "/images/bts/directed-1-2.jpg",
        caption: "Director discussing the scene",
        size: "large",
        aspect_ratio: "portrait",
      },
      {
        id: "bts-3",
        project_id: "directed-1",
        image_url: "/images/bts/directed-1-3.jpg",
        caption: "Lighting setup",
        size: "small",
        aspect_ratio: "square",
      },
      {
        id: "bts-4",
        project_id: "directed-1",
        image_url: "/images/bts/directed-1-4.jpg",
        caption: "Cast and crew",
        size: "medium",
        aspect_ratio: "landscape",
      },
    ])

    if (btsError) {
      return NextResponse.json(
        { success: false, message: `Error seeding BTS images: ${btsError.message}` },
        { status: 500 },
      )
    }

    return NextResponse.json({ success: true, message: "Sample data seeded successfully" })
  } catch (error) {
    console.error("Error seeding data:", error)
    return NextResponse.json(
      {
        success: false,
        message: `Error seeding data: ${error instanceof Error ? error.message : String(error)}`,
      },
      { status: 500 },
    )
  }
}
