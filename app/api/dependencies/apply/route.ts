import { NextResponse } from "next/server"
import { exec } from "child_process"
import { promisify } from "util"
import { createAdminClient } from "@/lib/supabase-server"

const execAsync = promisify(exec)

export async function POST() {
  try {
    const supabase = createAdminClient()

    // Check if dependencies table exists
    const { data: tableExists, error: checkError } = await supabase.rpc("check_table_exists", {
      table_name: "dependencies",
    })

    // Get the list of dependencies to update
    let dependenciesToUpdate = []

    if (!checkError && tableExists) {
      // Get global update mode
      const { data: settings, error: settingsError } = await supabase
        .from("dependency_settings")
        .select("update_mode")
        .limit(1)
        .single()

      const globalMode = settingsError ? "conservative" : settings?.update_mode || "conservative"

      // Get dependencies based on update mode
      const { data: deps, error: depsError } = await supabase
        .from("dependencies")
        .select("name, update_mode, has_security_update, locked")

      if (!depsError && deps) {
        // Filter dependencies based on update mode
        dependenciesToUpdate = deps
          .filter((dep) => {
            if (dep.locked) return false

            const mode = dep.update_mode === "global" ? globalMode : dep.update_mode

            if (mode === "auto") return true
            if (mode === "conservative" && dep.has_security_update) return true
            return false
          })
          .map((dep) => dep.name)
      }
    }

    // If no dependencies in database, get outdated dependencies
    if (dependenciesToUpdate.length === 0) {
      try {
        const { stdout } = await execAsync("npm outdated --json")
        const outdatedDeps = JSON.parse(stdout)
        dependenciesToUpdate = Object.keys(outdatedDeps)
      } catch (err) {
        // If no outdated dependencies, npm outdated exits with code 1
        console.log("No outdated dependencies found")
      }
    }

    if (dependenciesToUpdate.length === 0) {
      return NextResponse.json({
        success: true,
        message: "No dependencies to update",
      })
    }

    // Update each dependency
    const results = []

    for (const name of dependenciesToUpdate) {
      try {
        const { stdout } = await execAsync(`npm update ${name}`)

        // Get the new version
        const { stdout: lsOutput } = await execAsync(`npm ls ${name} --json --depth=0`)
        const lsData = JSON.parse(lsOutput)
        const newVersion = lsData.dependencies?.[name]?.version

        // Update the database if it exists
        if (!checkError && tableExists) {
          const { error: updateError } = await supabase.from("dependencies").upsert(
            {
              name,
              current_version: newVersion,
              latest_version: newVersion,
              has_security_update: false,
              last_updated: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            },
            { onConflict: "name" },
          )

          if (updateError) {
            console.error(`Error updating ${name} in database:`, updateError)
          }
        }

        results.push({
          name,
          success: true,
          newVersion,
        })
      } catch (error) {
        console.error(`Error updating ${name}:`, error)
        results.push({
          name,
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
