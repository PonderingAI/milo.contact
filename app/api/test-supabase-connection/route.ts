import { NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase-server"

export async function GET() {
  try {
    // Create a Supabase client
    const supabase = createAdminClient()

    // Try a simple query to the system catalog
    const { data, error } = await supabase
      .from("pg_catalog.pg_tables")
      .select("tablename")
      .eq("schemaname", "public")
      .limit(5)

    if (error) {
      throw error
    }

    return NextResponse.json({
      success: true,
      message: "Supabase connection is working",
      tables: data,
    })
  } catch (error) {
    console.error("Error testing Supabase connection:", error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
