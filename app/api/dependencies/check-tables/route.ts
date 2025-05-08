import { NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase-server"

export async function GET() {
  try {
    const supabase = createAdminClient()

    // Check if dependencies table exists
    const { data: dependenciesExists, error: dependenciesError } = await supabase.rpc("check_table_exists", {
      table_name: "dependencies",
    })

    if (dependenciesError) {
      console.error("Error checking if dependencies table exists:", dependenciesError)
      return NextResponse.json(
        {
          success: false,
          error: "Error checking if dependencies table exists",
          details: dependenciesError.message,
        },
        { status: 500 },
      )
    }

    // Check if dependency_settings table exists
    const { data: settingsExists, error: settingsError } = await supabase.rpc("check_table_exists", {
      table_name: "dependency_settings",
    })

    if (settingsError) {
      console.error("Error checking if dependency_settings table exists:", settingsError)
      return NextResponse.json(
        {
          success: false,
          error: "Error checking if dependency_settings table exists",
          details: settingsError.message,
        },
        { status: 500 },
      )
    }

    return NextResponse.json({
      success: true,
      tables: {
        dependencies: dependenciesExists,
        dependency_settings: settingsExists,
      },
    })
  } catch (error) {
    console.error("Error checking tables:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Error checking tables",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    )
  }
}
