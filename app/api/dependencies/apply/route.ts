import { NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase-server"
import { applyDependencyUpdates } from "@/lib/dependency-utils"

export async function POST() {
  try {
    const supabase = createAdminClient()

    // Get global update mode from settings
    const { data: settings, error: settingsError } = await supabase
      .from("dependency_settings")
      .select("update_mode")
      .limit(1)
      .single()

    const globalMode = settingsError ? "conservative" : settings?.update_mode || "conservative"

    // Apply updates based on global mode
    const result = await applyDependencyUpdates(globalMode as any)

    return NextResponse.json({
      success: true,
      updated: result.updated,
      failed: result.failed,
      results: result.results,
    })
  } catch (error) {
    console.error("Error applying updates:", error)
    return NextResponse.json(
      {
        error: "Failed to apply updates",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    )
  }
}
