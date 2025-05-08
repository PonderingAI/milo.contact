import { NextResponse } from "next/server"
import { getOutdatedPackages, getOutdatedPackagesWithNcu } from "@/lib/dependency-utils"

export async function GET() {
  try {
    // First try with npm outdated
    let outdatedDeps = {}
    let error = null

    try {
      outdatedDeps = await getOutdatedPackages()
    } catch (err) {
      console.error("Error using npm outdated, trying npm-check-updates:", err)
      error = err

      // Fall back to npm-check-updates
      try {
        outdatedDeps = await getOutdatedPackagesWithNcu()
      } catch (ncuErr) {
        console.error("Error using npm-check-updates:", ncuErr)
        throw ncuErr
      }
    }

    return NextResponse.json({
      success: true,
      outdated: outdatedDeps,
      count: Object.keys(outdatedDeps).length,
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
