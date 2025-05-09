import { NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase-server"

export async function GET() {
  try {
    const supabase = createAdminClient()

    // Check if the dependencies table exists
    const { data: tableExists, error: tableCheckError } = await supabase
      .from("information_schema.tables")
      .select("table_name")
      .eq("table_schema", "public")
      .eq("table_name", "dependencies")
      .single()

    if (tableCheckError && tableCheckError.code !== "PGRST116") {
      console.error("Error checking if dependencies table exists:", tableCheckError)
      return NextResponse.json(
        {
          dependencies: [],
          error: "Failed to check if dependencies table exists",
          details: tableCheckError.message,
          setupNeeded: true,
          setupMessage: "The dependency management system needs to be set up.",
          tableExists: false,
        },
        { status: 500 },
      )
    }

    // If table doesn't exist, return empty array with setup message
    if (!tableExists) {
      return NextResponse.json({
        dependencies: [],
        setupNeeded: true,
        setupMessage: "The dependency management system needs to be set up.",
        tableExists: false,
      })
    }

    // If table exists, fetch dependencies
    const { data: dependencies, error: fetchError } = await supabase.from("dependencies").select("*").order("name")

    if (fetchError) {
      console.error("Error fetching dependencies:", fetchError)
      return NextResponse.json(
        {
          dependencies: [],
          error: "Failed to fetch dependencies",
          details: fetchError.message,
          tableExists: true,
        },
        { status: 500 },
      )
    }

    return NextResponse.json({
      dependencies: dependencies || [],
      tableExists: true,
    })
  } catch (error) {
    console.error("Error in dependencies API:", error)
    return NextResponse.json(
      {
        dependencies: [],
        error: "An unexpected error occurred",
        details: error instanceof Error ? error.message : String(error),
        setupNeeded: true,
        setupMessage: "The dependency management system needs to be set up.",
        tableExists: false,
      },
      { status: 500 },
    )
  }
}
