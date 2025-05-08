import { NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase-server"
import { checkDependencyTablesExist } from "@/lib/check-tables"
import { setupDependencyTables } from "@/lib/setup-dependency-tables"

export async function GET() {
  try {
    // Check if tables exist
    const tablesExist = await checkDependencyTablesExist()

    // If tables don't exist, try to set them up
    if (!tablesExist) {
      console.log("Dependency tables don't exist, setting them up...")
      const setupSuccess = await setupDependencyTables()

      if (!setupSuccess) {
        return NextResponse.json({
          success: false,
          error: "Failed to set up dependency tables",
          dependencies: [],
        })
      }
    }

    const supabase = createAdminClient()

    // Fetch dependencies
    const { data: dependencies, error: fetchError } = await supabase.from("dependencies").select("*").order("name")

    if (fetchError) {
      console.error("Error fetching dependencies:", fetchError)
      return NextResponse.json({
        success: false,
        error: "Error fetching dependencies",
        dependencies: [],
      })
    }

    // Fetch settings
    const { data: settings, error: settingsError } = await supabase
      .from("dependency_settings")
      .select("*")
      .limit(1)
      .single()

    if (settingsError && !settingsError.message.includes("No rows found")) {
      console.error("Error fetching dependency settings:", settingsError)
    }

    // Calculate stats
    const vulnerabilities = dependencies?.filter((d) => d.has_security_update).length || 0
    const outdatedPackages = dependencies?.filter((d) => d.outdated).length || 0

    return NextResponse.json({
      success: true,
      dependencies: dependencies || [],
      updateMode: settings?.update_mode || "conservative",
      vulnerabilities,
      outdatedPackages,
      securityScore: calculateSecurityScore(dependencies || []),
      lastScan: settings?.updated_at || new Date().toISOString(),
    })
  } catch (error) {
    console.error("Error in dependencies API:", error)
    return NextResponse.json({
      success: false,
      error: "An unexpected error occurred",
      dependencies: [],
    })
  }
}

// Calculate security score
function calculateSecurityScore(deps) {
  const totalDeps = deps.length
  if (totalDeps === 0) return 100

  const vulnerableDeps = deps.filter((d) => d.has_security_update).length
  const outdatedDeps = deps.filter((d) => d.outdated).length

  let score = 100
  score -= (vulnerableDeps / totalDeps) * 50
  score -= (outdatedDeps / totalDeps) * 20

  return Math.max(0, Math.min(100, Math.round(score)))
}
