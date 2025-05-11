import { createClient } from "@/lib/supabase-server"
import { NextResponse } from "next/server"
import { exec } from "child_process"
import { promisify } from "util"

const execAsync = promisify(exec)

// Helper function to update a dependency
async function updateDependency(name: string, version: string | null) {
  try {
    const command = version ? `npm install ${name}@${version} --save-exact` : `npm install ${name}@latest`

    const { stdout, stderr } = await execAsync(command)
    return { success: true, stdout, stderr }
  } catch (error) {
    console.error(`Error updating ${name}:`, error)
    throw new Error(`Failed to update ${name}: ${error instanceof Error ? error.message : String(error)}`)
  }
}

export async function GET() {
  try {
    const supabase = createClient()

    // First, check if the tables exist
    try {
      // Get dependencies that should be auto-updated
      const { data: dependencies, error: fetchError } = await supabase
        .from("dependencies")
        .select("*")
        .or("update_mode.eq.auto,and(update_mode.eq.conservative,has_security_update.eq.true)")
        .eq("locked", false)

      if (fetchError) {
        // If tables don't exist, set them up
        if (fetchError.message.includes("does not exist")) {
          await fetch("/api/dependencies/setup", { method: "POST" })
          return NextResponse.json({ message: "Dependencies tables set up. No updates to apply yet." })
        }

        return NextResponse.json({ error: fetchError.message }, { status: 500 })
      }

      if (!dependencies || dependencies.length === 0) {
        return NextResponse.json({ message: "No dependencies to auto-update" })
      }

      // Update each dependency
      const results = []

      for (const dep of dependencies) {
        try {
          await updateDependency(dep.name, dep.latest_version)

          // Update the database
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

      return NextResponse.json({
        success: true,
        updated: results.filter((r) => r.success).length,
        failed: results.filter((r) => !r.success).length,
        results,
      })
    } catch (error) {
      // If the query fails because the table doesn't exist, set up the tables
      if (error instanceof Error && error.message.includes("does not exist")) {
        await fetch("/api/dependencies/setup", { method: "POST" })
        return NextResponse.json({ message: "Dependencies tables set up. No updates to apply yet." })
      }
      throw error
    }
  } catch (error) {
    console.error("Error in auto-update dependencies:", error)
    return NextResponse.json(
      {
        error: "An unexpected error occurred",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    )
  }
}

export async function POST() {
  try {
    // In a real implementation, this would run npm/yarn update for all non-locked packages
    // For now, we'll simulate a delay and return success
    await new Promise((resolve) => setTimeout(resolve, 2000))

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error in auto-update API:", error)
    return NextResponse.json({ error: "Failed to run auto updates" }, { status: 500 })
  }
}
