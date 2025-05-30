import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { NextResponse } from "next/server"

export const dynamic = "force-dynamic"

export async function GET() {
  try {
    const supabase = createRouteHandlerClient({ cookies })

    // Check if the projects table exists
    const { data: projectsExists, error: projectsError } = await supabase
      .from("projects")
      .select("id")
      .limit(1)
      .single()

    // Check if the settings table exists
    const { data: settingsExists, error: settingsError } = await supabase
      .from("site_settings")
      .select("id")
      .limit(1)
      .single()

    // Check if the media table exists
    const { data: mediaExists, error: mediaError } = await supabase.from("media").select("id").limit(1).single()

    // Check if the dependencies table exists
    const { data: dependenciesExists, error: dependenciesError } = await supabase
      .from("dependencies")
      .select("id")
      .limit(1)
      .single()

    // Determine which tables need to be created
    const tablesNeeded = []

    if (projectsError && projectsError.code === "PGRST116") {
      tablesNeeded.push("projects")
    }

    if (settingsError && settingsError.code === "PGRST116") {
      tablesNeeded.push("site_settings")
    }

    if (mediaError && mediaError.code === "PGRST116") {
      tablesNeeded.push("media")
    }

    if (dependenciesError && dependenciesError.code === "PGRST116") {
      tablesNeeded.push("dependencies")
    }

    return NextResponse.json({
      tablesNeeded,
      allTablesExist: tablesNeeded.length === 0,
    })
  } catch (error) {
    // Silently handle the error but return a valid response
    console.error("Error checking database setup:", error)
    return NextResponse.json({
      tablesNeeded: [],
      allTablesExist: false,
      error: "Error checking database setup",
    })
  }
}
