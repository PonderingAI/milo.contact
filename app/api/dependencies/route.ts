import { NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase-server"
import { checkTableExists, getDependenciesFromDatabase } from "@/lib/table-utils"

export async function GET() {
  try {
    // Get dependencies using the more reliable function
    const { dependencies, error } = await getDependenciesFromDatabase()

    if (error) {
      console.error("Error fetching dependencies:", error)
      // Return empty array instead of error to avoid breaking the UI
      return NextResponse.json({
        dependencies: [],
        vulnerabilities: 0,
        outdatedPackages: 0,
        securityScore: 100,
        lastScan: new Date().toISOString(),
        error: error,
      })
    }

    // Count vulnerabilities and outdated packages
    const vulnerabilities = dependencies.filter((dep) => dep.has_security_update).length
    const outdatedPackages = dependencies.filter((dep) => dep.outdated).length

    // Calculate security score
    const securityScore = calculateSecurityScore(dependencies)

    // Get settings
    const supabase = createAdminClient()
    const settingsTableExists = await checkTableExists("dependency_settings")

    let updateMode = "conservative"
    if (settingsTableExists) {
      const { data: settings } = await supabase.from("dependency_settings").select("update_mode").limit(1).single()

      if (settings) {
        updateMode = settings.update_mode
      }
    }

    return NextResponse.json({
      dependencies,
      vulnerabilities,
      outdatedPackages,
      securityScore,
      updateMode,
      lastScan: new Date().toISOString(),
    })
  } catch (error) {
    console.error("Error in dependencies API:", error)
    // Return empty array instead of error to avoid breaking the UI
    return NextResponse.json({
      dependencies: [],
      vulnerabilities: 0,
      outdatedPackages: 0,
      securityScore: 100,
      lastScan: new Date().toISOString(),
      error: error instanceof Error ? error.message : String(error),
    })
  }
}

// Calculate security score based on vulnerabilities and outdated packages
function calculateSecurityScore(dependencies: any[]): number {
  const totalDeps = dependencies.length
  if (totalDeps === 0) return 100

  const vulnerableDeps = dependencies.filter((dep) => dep.has_security_update).length
  const outdatedDeps = dependencies.filter((dep) => dep.outdated).length

  // Calculate score: start with 100 and deduct points
  let score = 100

  // Deduct more for vulnerable dependencies
  score -= (vulnerableDeps / totalDeps) * 50

  // Deduct less for outdated dependencies
  score -= (outdatedDeps / totalDeps) * 20

  // Ensure score is between 0 and 100
  return Math.max(0, Math.min(100, Math.round(score)))
}
