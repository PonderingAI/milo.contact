import { NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase-server"

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  try {
    const projectId = params.id
    const projectData = await request.json()

    console.log("Updating project with data:", projectData)

    // Validate required fields
    const requiredFields = ["title", "image", "category", "role"]
    const missingFields = requiredFields.filter((field) => {
      const value = projectData[field]
      return value === undefined || value === null || value === ""
    })

    if (missingFields.length > 0) {
      console.error(`Missing required fields: ${missingFields.join(", ")}`, {
        receivedData: projectData,
      })

      return NextResponse.json(
        {
          success: false,
          error: `Missing required fields: ${missingFields.join(", ")}`,
          details: "Please fill in all required fields before submitting.",
          receivedData: projectData,
        },
        { status: 400 },
      )
    }

    // Use the admin client to bypass RLS
    const supabase = createAdminClient()

    // Update the project
    const { data, error } = await supabase.from("projects").update(projectData).eq("id", projectId).select()

    if (error) {
      console.error("Error updating project:", error)
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
      message: "Project updated successfully",
    })
  } catch (error) {
    console.error("Unexpected error updating project:", error)
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
