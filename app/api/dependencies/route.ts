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

    // If table doesn't exist, return a simple response indicating setup is needed
    if (!tableExists || tableCheckError) {
      return NextResponse.json({
        dependencies: [],
        setupNeeded: true,
        tableExists: false,
      })
    }

    // If table exists, fetch dependencies
    const { data: dependencies, error: fetchError } = await supabase.from("dependencies").select("*").order("name")

    if (fetchError) {
      console.error("Error fetching dependencies:", fetchError)
      return NextResponse.json({
        dependencies: [],
        error: "Failed to fetch dependencies",
        tableExists: true,
      })
    }

    return NextResponse.json({
      dependencies: dependencies || [],
      tableExists: true,
    })
  } catch (error) {
    console.error("Error in dependencies API:", error)
    return NextResponse.json({
      dependencies: [],
      setupNeeded: true,
      tableExists: false,
    })
  }
}
