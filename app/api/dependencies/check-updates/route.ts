import { NextResponse } from "next/server"
import { exec } from "child_process"
import { promisify } from "util"
import { createAdminClient } from "@/lib/supabase-server"

const execAsync = promisify(exec)

export async function GET() {
  try {
    console.log("Running npm outdated to check for updates...")

    // First try npm outdated --json
    let outdatedDeps = {}
    let method = "npm-outdated"

    try {
      // Run npm outdated --json to get outdated dependencies
      const { stdout } = await execAsync("npm outdated --json", { timeout: 30000 })

      // Parse the JSON output
      if (stdout && stdout.trim()) {
        outdatedDeps = JSON.parse(stdout)
        console.log(`Found ${Object.keys(outdatedDeps).length} outdated packages using npm outdated`)
      }
    } catch (error) {
      console.log("Error or non-zero exit code from npm outdated (expected if packages are outdated)")

      // npm outdated returns exit code 1 if there are outdated packages
      if (error instanceof Error && "stdout" in error) {
        try {
          const stdout = (error as any).stdout
          if (stdout && stdout.trim()) {
            outdatedDeps = JSON.parse(stdout)
            console.log(`Found ${Object.keys(outdatedDeps).length} outdated packages from npm outdated stderr`)
          }
        } catch (parseError) {
          console.error("Error parsing npm outdated output:", parseError)

          // If npm outdated fails, try npm-check-updates
          try {
            console.log("Trying npm-check-updates as fallback...")
            method = "ncu"

            const { stdout: ncuStdout } = await execAsync("npx npm-check-updates --jsonUpgraded", { timeout: 30000 })

            if (ncuStdout && ncuStdout.trim()) {
              const ncuResult = JSON.parse(ncuStdout)

              // Transform ncu output to match npm outdated format
              outdatedDeps = {}
              for (const [name, version] of Object.entries(ncuResult)) {
                outdatedDeps[name] = {
                  current: "unknown", // We'll update this from package.json later
                  wanted: "unknown",
                  latest: version,
                  location: "unknown",
                  dependent: "unknown",
                  type: "unknown",
                }
              }

              console.log(`Found ${Object.keys(outdatedDeps).length} outdated packages using npm-check-updates`)
            }
          } catch (ncuError) {
            console.error("Error running npm-check-updates:", ncuError)
            // Continue with empty outdated deps
          }
        }
      }
    }

    // Update the database with the outdated packages info
    const supabase = createAdminClient()

    // Get all dependencies from the database
    const { data: dependencies, error: fetchError } = await supabase.from("dependencies").select("*")

    if (fetchError) {
      console.error("Error fetching dependencies:", fetchError)
    } else if (dependencies && dependencies.length > 0) {
      console.log(`Updating ${dependencies.length} dependencies in the database...`)

      // Update each dependency
      for (const dep of dependencies) {
        const outdatedInfo = outdatedDeps[dep.name]
        const isOutdated = !!outdatedInfo
        const latestVersion = outdatedInfo?.latest || dep.current_version

        // Update the dependency in the database
        const { error: updateError } = await supabase
          .from("dependencies")
          .update({
            latest_version: latestVersion,
            outdated: isOutdated,
            updated_at: new Date().toISOString(),
          })
          .eq("name", dep.name)

        if (updateError) {
          console.error(`Error updating dependency ${dep.name}:`, updateError)
        }
      }

      console.log("Database updated successfully")
    }

    return NextResponse.json({
      success: true,
      outdated: outdatedDeps,
      count: Object.keys(outdatedDeps).length,
      method: method,
    })
  } catch (error) {
    console.error("Error checking for updates:", error)

    return NextResponse.json(
      {
        error: "Failed to check for updates",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    )
  }
}

// Also support POST for manual triggering
export async function POST() {
  return GET()
}
