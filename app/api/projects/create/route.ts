import { NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase-server"

export async function POST(request: Request) {
  try {
    const projectData = await request.json()

    // Use the admin client to bypass RLS
    const supabase = createAdminClient()

    // Insert the project
    const { data, error } = await supabase.from("projects").insert([projectData]).select()

    if (error) {
      console.error("Error creating project:", error)
      return NextResponse.json(
        {
          success: false,
          error: error.message,
          details: "This could be due to missing required fields or database constraints.",
        },
        { status: 500 },
      )
    }

    return NextResponse.json({
      success: true,
      data,
      message: "Project created successfully",
    })
  } catch (error) {
    console.error("Unexpected error creating project:", error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error occurred",
        details: "There was an unexpected error processing your request.",
      },
      { status: 500 },
    )
  }
}
