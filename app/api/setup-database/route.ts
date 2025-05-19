import { createAdminClient } from "@/lib/supabase-server"
import { NextResponse } from "next/server"

export async function POST() {
  try {
    const supabase = createAdminClient()

    // Check if tables already exist by trying to query them
    const { error: checkError } = await supabase.from("projects").select("count(*)", { count: "exact", head: true })

    // If there's no error, tables might already exist
    if (!checkError) {
      return NextResponse.json({ success: true, message: "Database tables already exist" })
    }

    // If we get here, tables don't exist, so we need to provide SQL for manual creation
    return NextResponse.json(
      {
        success: false,
        message: "Please create the tables manually using the SQL provided in the setup page",
        needsManualSetup: true,
      },
      { status: 200 }, // Using 200 status since this is an expected path
    )
  } catch (error) {
    console.error("Error checking database:", error)
    return NextResponse.json(
      {
        success: false,
        message: `Error checking database: ${error instanceof Error ? error.message : String(error)}`,
        needsManualSetup: true,
      },
      { status: 500 },
    )
  }
}
