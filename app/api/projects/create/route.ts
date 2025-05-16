import { NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase-server"

export async function POST(request: Request) {
  try {
    const projectData = await request.json()

    console.log("Received project data:", projectData)

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

    // Insert the project
    const { data, error } = await supabase.from("projects").insert([projectData]).select()

    if (error) {
      console.error("Error creating project:", error)
      return NextResponse.json(
        {
          success: false,
          error: error.message,
          details: "Database error: " + error.message,
          code: error.code,
          hint: error.hint,
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
