import { NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase-server"

export async function GET() {
  try {
    const supabase = createAdminClient()

    // Check if the dependencies table exists
    try {
      const { data, error } = await supabase
        .from("information_schema.tables")
        .select("table_name")
        .eq("table_schema", "public")
        .eq("table_name", "dependencies")
        .single()

      if (error || !data) {
        // Table doesn't exist, return a structured response
        return NextResponse.json({
          dependencies: [],
          setupNeeded: true,
          setupMessage: "The dependency management system needs to be set up.",
          tableExists: false,
        })
      }
    } catch (error) {
      console.error("Error checking if dependencies table exists:", error)
      // Return a fallback response
      return NextResponse.json({
        dependencies: [],
        setupNeeded: true,
        setupMessage: "Error checking database tables. Please set up the dependency system.",
        error: error instanceof Error ? error.message : "Unknown error",
      })
    }

    // Try to get dependencies from the table
    try {
      const { data: dependencies, error } = await supabase.from("dependencies").select("*")

      if (error) {
        throw error
      }

      return NextResponse.json({
        dependencies: dependencies || [],
        tableExists: true,
      })
    } catch (error) {
      console.error("Error fetching dependencies:", error)
      // Return empty dependencies with an error message
      return NextResponse.json({
        dependencies: [],
        tableExists: true,
        error: error instanceof Error ? error.message : "Unknown error",
        message: "Failed to fetch dependencies. Please try again.",
      })
    }
  } catch (error) {
    console.error("Unexpected error in dependencies API:", error)
    return NextResponse.json({
      dependencies: [],
      error: error instanceof Error ? error.message : "Unknown error",
      message: "An unexpected error occurred.",
    })
  }
}
