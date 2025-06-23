import { NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase-server"

export async function GET() {
  try {
    const supabase = createAdminClient()

    // Check if the projects table exists first
    const { data: tableExists, error: tableCheckError } = await supabase
      .from("information_schema.tables")
      .select("table_name")
      .eq("table_name", "projects")
      .eq("table_schema", "public")
      .single()

    if (tableCheckError) {
      console.log("Projects table does not exist or cannot be accessed")
      return NextResponse.json({ 
        exists: false, 
        columns: [],
        message: "Projects table does not exist" 
      })
    }

    // Query to get the column information for the projects table
    const { data, error } = await supabase
      .from("information_schema.columns")
      .select("column_name, data_type, is_nullable")
      .eq("table_name", "projects")
      .eq("table_schema", "public")
      .order("ordinal_position")

    if (error) {
      console.error("Error fetching projects schema:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ 
      exists: true,
      columns: data || [],
      count: data?.length || 0
    })
  } catch (error: any) {
    console.error("Error in check-projects-schema:", error)
    return NextResponse.json({ 
      error: error.message || "An unknown error occurred",
      exists: false,
      columns: []
    }, { status: 500 })
  }
}
