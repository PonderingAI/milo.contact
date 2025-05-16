import { NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase-server"

export async function POST(request: Request) {
  try {
    const supabase = createAdminClient()
    const formData = await request.json()

    // Log the received data for debugging
    console.log("Received project data:", formData)

    // Check for required fields
    const requiredFields = ["title", "image", "category", "role"]
    const missingFields = requiredFields.filter((field) => !formData[field])

    if (missingFields.length > 0) {
      console.error("Missing required fields:", missingFields)
      return NextResponse.json(
        {
          error: `Missing required fields: ${missingFields.join(", ")}`,
          receivedData: formData,
        },
        { status: 400 },
      )
    }

    // Insert the project
    const { data, error } = await supabase.from("projects").insert([formData]).select()

    if (error) {
      console.error("Error inserting project:", error)
      return NextResponse.json(
        {
          error: `Error inserting project: ${error.message}`,
          details: error,
        },
        { status: 500 },
      )
    }

    return NextResponse.json({
      success: true,
      project: data[0],
    })
  } catch (error) {
    console.error("Unexpected error creating project:", error)
    return NextResponse.json(
      {
        error: `Unexpected error: ${error instanceof Error ? error.message : "Unknown error"}`,
      },
      { status: 500 },
    )
  }
}
