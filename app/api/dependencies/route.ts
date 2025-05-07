import { NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase-server"

export async function GET() {
  try {
    const supabase = createAdminClient()

    // Check if dependencies table exists
    const { data: tableExists, error: tableCheckError } = await supabase.rpc("check_table_exists", {
      table_name: "dependencies",
    })

    if (tableCheckError) {
      console.error("Error checking if dependencies table exists:", tableCheckError)
      return NextResponse.json({
        dependencies: [],
        error: "Error checking if dependencies table exists",
        success: false,
      })
    }

    if (!tableExists) {
      console.log("Dependencies table does not exist.")
      return NextResponse.json({
        dependencies: [],
        success: true,
      })
    }

    // Get dependencies from database
    const { data: dependencies, error: fetchError } = await supabase.from("dependencies").select("*").order("name")

    if (fetchError) {
      console.error("Error fetching dependencies:", fetchError)
      return NextResponse.json({
        dependencies: [],
        error: "Error fetching dependencies",
        success: false,
      })
    }

    // Get global update mode
    const { data: settings, error: settingsError } = await supabase
      .from("dependency_settings")
      .select("update_mode")
      .single()

    if (settingsError && !settingsError.message.includes("No rows found")) {
      console.error("Error fetching dependency settings:", settingsError)
    }

    // Calculate security stats
    const vulnerableCount = dependencies?.filter((d) => d.has_security_update).length || 0
    const outdatedCount = dependencies?.filter((d) => d.outdated).length || 0

    return NextResponse.json({
      dependencies: dependencies || [],
      updateMode: settings?.update_mode || "conservative",
      vulnerabilities: vulnerableCount,
      outdatedPackages: outdatedCount,
      securityScore: calculateSecurityScore(dependencies || []),
      lastScan: new Date().toISOString(),
      success: true,
    })
  } catch (error) {
    console.error("Error in dependencies API:", error)
    return NextResponse.json({
      dependencies: [],
      error: "Error fetching dependencies",
      details: error instanceof Error ? error.message : String(error),
      success: false,
    })
  }
}

// Calculate security score based on vulnerabilities and outdated packages
function calculateSecurityScore(deps: any[]): number {
  const totalDeps = deps.length
  if (totalDeps === 0) return 100

  const vulnerableDeps = deps.filter((d) => d.has_security_update).length
  const outdatedDeps = deps.filter((d) => d.outdated).length

  // Calculate score: start with 100 and deduct points
  let score = 100

  // Deduct more for vulnerable dependencies
  score -= (vulnerableDeps / totalDeps) * 50

  // Deduct less for outdated dependencies
  score -= (outdatedDeps / totalDeps) * 20

  // Ensure score is between 0 and 100
  return Math.max(0, Math.min(100, Math.round(score)))
}
