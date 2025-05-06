import { NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase-server"

// This endpoint will be called by a cron job every hour
export async function GET() {
  try {
    const supabase = createAdminClient()

    // Get the global update mode
    const { data: settings, error: settingsError } = await supabase.from("dependency_settings").select("*").single()

    if (settingsError) {
      return NextResponse.json({ error: settingsError.message }, { status: 500 })
    }

    const globalMode = settings?.update_mode || "conservative"

    // Get dependencies that should be auto-updated based on their update mode
    const { data: dependencies, error: fetchError } = await supabase
      .from("dependencies")
      .select("*")
      .or(
        `update_mode.eq.aggressive,and(update_mode.eq.conservative,has_security_update.eq.true),and(update_mode.eq.global,and(${globalMode}.eq.aggressive,or(${globalMode}.eq.conservative,has_security_update.eq.true)))`,
      )
      .eq("locked", false)

    if (fetchError) {
      return NextResponse.json({ error: fetchError.message }, { status: 500 })
    }

    if (!dependencies || dependencies.length === 0) {
      return NextResponse.json({ message: "No dependencies to auto-update" })
    }

    // Update each dependency in the database
    const results = []

    for (const dep of dependencies) {
      try {
        // In a real implementation, this would actually update the dependency
        // For now, we'll just update the database

        const { error: updateError } = await supabase
          .from("dependencies")
          .update({
            current_version: dep.latest_version,
            last_updated: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            has_security_update: false,
          })
          .eq("id", dep.id)

        if (updateError) {
          results.push({
            name: dep.name,
            success: false,
            error: updateError.message,
          })
        } else {
          results.push({
            name: dep.name,
            success: true,
            from: dep.current_version,
            to: dep.latest_version,
          })
        }
      } catch (error) {
        results.push({
          name: dep.name,
          success: false,
          error: error instanceof Error ? error.message : String(error),
        })
      }
    }

    // Log the update to the security_audits table
    await supabase.from("security_audits").insert({
      type: "scheduled_update",
      results: results,
      created_at: new Date().toISOString(),
    })

    return NextResponse.json({
      success: true,
      updated: results.filter((r) => r.success).length,
      failed: results.filter((r) => !r.success).length,
      results,
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
