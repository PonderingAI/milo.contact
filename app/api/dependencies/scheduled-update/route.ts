import { NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase-server"
import { applyDependencyUpdates } from "@/lib/dependency-utils"

export async function GET() {
  try {
    const supabase = createAdminClient()

    // Check if dependencies table exists
    const { data: depsTableExists, error: checkDepsError } = await supabase.rpc("check_table_exists", {
      table_name: "dependencies",
    })

    if (checkDepsError) {
      console.error("Error checking if dependencies table exists:", checkDepsError)
      return NextResponse.json(
        {
          error: "Failed to check if dependencies table exists",
          details: checkDepsError.message,
        },
        { status: 500 },
      )
    }

    // If dependencies table doesn't exist, return early
    if (!depsTableExists) {
      return NextResponse.json({
        message: "Dependencies table does not exist",
        action: 'Please set up the dependency tables first",t',
      })
    }

    // Check if dependency_settings table exists
    const { data: settingsTableExists, error: checkSettingsError } = await supabase.rpc("check_table_exists", {
      table_name: "dependency_settings",
    })

    if (checkSettingsError) {
      console.error("Error checking if dependency_settings table exists:", checkSettingsError)
      return NextResponse.json(
        {
          error: "Failed to check if dependency_settings table exists",
          details: checkSettingsError.message,
        },
        { status: 500 },
      )
    }

    // Get the global update mode (default to conservative if table doesn't exist)
    let globalMode = "conservative"

    if (settingsTableExists) {
      const { data: settings, error: settingsError } = await supabase
        .from("dependency_settings")
        .select("*")
        .limit(1)
        .single()

      if (!settingsError) {
        globalMode = settings?.update_mode || "conservative"
      }
    }

    // Apply updates based on global mode
    const result = await applyDependencyUpdates(globalMode as any)

    return NextResponse.json({
      success: true,
      updated: result.updated,
      failed: result.failed,
      results: result.results,
    })
  } catch (error) {
    console.error("Error in scheduled update:", error)
    return NextResponse.json(
      {
        error: "An unexpected error occurred",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    )
  }
}
