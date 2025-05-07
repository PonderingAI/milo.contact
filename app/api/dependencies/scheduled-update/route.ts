import { NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase-server"
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
        action: "Please set up the dependency tables first",
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

    // Get dependencies that should be auto-updated based on their update mode
    const { data: dependencies, error: fetchError } = await supabase
      .from("dependencies")
      .select("*")
      .or(`update_mode.eq.auto,and(update_mode.eq.conservative,has_security_update.eq.true)`)
      .eq("locked", false)

    if (fetchError) {
      console.error("Error fetching dependencies:", fetchError)
      return NextResponse.json(
        {
          error: "Failed to fetch dependencies",
          details: fetchError.message,
        },
        { status: 500 },
      )
    }

    if (!dependencies || dependencies.length === 0) {
      return NextResponse.json({ message: "No dependencies to auto-update" })
    }

    // Update each dependency in the database
    const results = []

    for (const dep of dependencies) {
      try {
        // In a real implementation, this would actually update the dependency
        // For now, we'll just update the database record

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
          console.error(`Error updating dependency ${dep.name}:`, updateError)
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
        console.error(`Error processing dependency ${dep.name}:`, error)
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
