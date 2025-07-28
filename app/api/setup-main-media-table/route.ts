import { NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase-server"

export async function POST() {
  console.log("=== SETTING UP MAIN MEDIA TABLE ===")
  
  try {
    // Use admin client to bypass RLS
    const supabase = createAdminClient()

    // Check if main_media table already exists
    const { data: existingTable, error: checkError } = await supabase
      .from("main_media")
      .select("id")
      .limit(1)

    if (checkError && checkError.code !== 'PGRST116') {
      // PGRST116 means table doesn't exist, which is expected
      console.error("Error checking main_media table:", checkError)
      return NextResponse.json({
        success: false,
        error: "Failed to check main_media table",
        details: checkError.message
      }, { status: 500 })
    }

    if (existingTable) {
      console.log("Main media table already exists")
      return NextResponse.json({
        success: true,
        message: "Main media table already exists",
        tableExists: true
      })
    }

    // Since we can't create tables via Supabase client, we'll return a message
    // instructing the user to run the migration manually
    console.log("Main media table does not exist - manual migration required")
    
    return NextResponse.json({
      success: false,
      error: "Main media table does not exist",
      message: "Please run the database migration manually using the SQL script in docs/migrations/",
      manualMigrationRequired: true,
      migrationScript: "docs/migrations/fix-thumbnail-visibility-default.sql"
    }, { status: 400 })

  } catch (error) {
    console.error("Unexpected error setting up main media table:", error)
    return NextResponse.json({
      success: false,
      error: "Unexpected error occurred",
      details: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 })
  }
}