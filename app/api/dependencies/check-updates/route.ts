import { NextResponse } from "next/server"
import { exec } from "child_process"
import { promisify } from "util"

const execAsync = promisify(exec)

export async function GET() {
  try {
    // First try npm-check-updates for more detailed information
    try {
      const { stdout: ncuOutput } = await execAsync("npx npm-check-updates --jsonUpgraded", { timeout: 30000 })
      const ncuData = JSON.parse(ncuOutput)

      // Transform to the format we need
      const outdatedDeps = {}
      Object.entries(ncuData).forEach(([name, version]) => {
        outdatedDeps[name] = { latest: version }
      })

      return NextResponse.json({
        success: true,
        outdated: outdatedDeps,
        count: Object.keys(outdatedDeps).length,
        source: "npm-check-updates",
      })
    } catch (ncuError) {
      console.error("Error using npm-check-updates, falling back to npm outdated:", ncuError)
    }

    // Fallback to npm outdated
    const { stdout } = await execAsync("npm outdated --json --all", { timeout: 30000 })

    // Parse the JSON output (if empty, there are no outdated dependencies)
    let outdatedDeps = {}
    try {
      outdatedDeps = JSON.parse(stdout)
    } catch (e) {
      // If parsing fails, it's likely because there are no outdated dependencies
      outdatedDeps = {}
    }

    return NextResponse.json({
      success: true,
      outdated: outdatedDeps,
      count: Object.keys(outdatedDeps).length,
      source: "npm-outdated",
    })
  } catch (error) {
    console.error("Error checking for updates:", error)

    // If the command fails but returns data about outdated packages
    if (error instanceof Error && "stdout" in error) {
      try {
        const outdatedDeps = JSON.parse((error as any).stdout)
        return NextResponse.json({
          success: true,
          outdated: outdatedDeps,
          count: Object.keys(outdatedDeps).length,
          source: "npm-outdated-error",
        })
      } catch (parseError) {
        // If parsing fails, continue to the error response
      }
    }

    return NextResponse.json(
      {
        error: "Failed to check for updates",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    )
  }
}
