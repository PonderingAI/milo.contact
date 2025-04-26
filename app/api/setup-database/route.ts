import { createServerClient } from "@/lib/supabase"
import { NextResponse } from "next/server"

export async function POST() {
  try {
    const supabase = createServerClient()

    // Create projects table
    const { error: projectsError } = await supabase.rpc("create_projects_table")
    if (projectsError) {
      return NextResponse.json(
        { success: false, message: `Error creating projects table: ${projectsError.message}` },
        { status: 500 },
      )
    }

    // Create BTS images table
    const { error: btsError } = await supabase.rpc("create_bts_images_table")
    if (btsError) {
      return NextResponse.json(
        { success: false, message: `Error creating BTS images table: ${btsError.message}` },
        { status: 500 },
      )
    }

    return NextResponse.json({ success: true, message: "Database tables created successfully" })
  } catch (error) {
    console.error("Error setting up database:", error)
    return NextResponse.json(
      {
        success: false,
        message: `Error setting up database: ${error instanceof Error ? error.message : String(error)}`,
      },
      { status: 500 },
    )
  }
}
