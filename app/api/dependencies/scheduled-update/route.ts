import { NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase-server"
import { applyDependencyUpdates } from "@/lib/dependency-utils"
import { checkTableExists } from "@/lib/table-utils"

export async function GET() {
  try {
    const supabase = createAdminClient()

    // Use the more reliable table check function
    const depsTableExists = await checkTableExists("dependencies")
    const settingsTableExists = await checkTableExists("dependency_settings")

    // If dependencies table doesn't exist, return early
    if (!depsTableExists) {
      return NextResponse.json({
        message: "Dependencies table does not exist",
        action: "Please set up the dependency tables first",
      })
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
