import { NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase-server"

export async function GET() {
  try {
    const supabase = createAdminClient()

    // Check if dependencies table exists
    const { data: depsTableExists, error: depsError } = await supabase.rpc("check_table_exists", {
      table_name: "dependencies",
    })

    if (depsError) {
      console.error("Error checking dependencies table:", depsError)
      return NextResponse.json(
        {
          error: "Failed to check if dependencies table exists",
          details: depsError.message,
        },
        { status: 500 },
      )
    }

    // Check if dependency_settings table exists
    const { data: settingsTableExists, error: settingsError } = await supabase.rpc("check_table_exists", {
      table_name: "dependency_settings",
    })

    if (settingsError) {
      console.error("Error checking dependency_settings table:", settingsError)
      return NextResponse.json(
        {
          error: "Failed to check if dependency_settings table exists",
          details: settingsError.message,
        },
        { status: 500 },
      )
    }

    return NextResponse.json({
      success: true,
      tables: {
        dependencies: depsTableExists,
        dependency_settings: settingsTableExists,
      },
    })
  } catch (error) {
    console.error("Error checking tables:", error)
    return NextResponse.json(
      {
        error: "Failed to check tables",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    )
  }
}
