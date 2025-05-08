import { NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase-server"

export async function GET() {
  try {
    const supabase = createAdminClient()

    // Check if tables exist
    const { data: tablesExist, error: checkError } = await supabase.rpc("check_table_exists", {
      table_name: "dependencies",
    })

    if (checkError) {
      console.error("Error checking if tables exist:", checkError)
      return NextResponse.json(
        {
          success: false,
          error: "Error checking if tables exist",
          dependencies: [],
        },
        { status: 200 }, // Return 200 to avoid triggering error handling
      )
    }

    // If tables don't exist, return empty array
    if (!tablesExist) {
      return NextResponse.json({
        success: false,
        error: "Dependencies table does not exist",
        dependencies: [],
      })
    }

    // Fetch dependencies
    const { data: dependencies, error: fetchError } = await supabase.from("dependencies").select("*").order("name")

    if (fetchError) {
      console.error("Error fetching dependencies:", fetchError)
      return NextResponse.json(
        {
          success: false,
          error: "Error fetching dependencies",
          dependencies: [],
        },
        { status: 200 }, // Return 200 to avoid triggering error handling
      )
    }

    // Fetch global settings
    const { data: settings, error: settingsError } = await supabase
      .from("dependency_settings")
      .select("*")
      .limit(1)
      .single()

    if (settingsError && settingsError.code !== "PGRST116") {
      // PGRST116 is "no rows returned" which is fine
      console.error("Error fetching dependency settings:", settingsError)
    }

    // Count vulnerabilities and outdated packages
    const vulnerabilities = dependencies?.filter((dep) => dep.has_security_update).length || 0
    const outdatedPackages = dependencies?.filter((dep) => dep.outdated).length || 0

    // Calculate security score
    const securityScore = calculateSecurityScore(dependencies || [])

    return NextResponse.json({
      success: true,
      dependencies: dependencies || [],
      updateMode: settings?.update_mode || "conservative",
      autoUpdateEnabled: settings?.auto_update_enabled || false,
      updateSchedule: settings?.update_schedule || "daily",
      vulnerabilities,
      outdatedPackages,
      securityScore,
      lastScan: settings?.updated_at || new Date().toISOString(),
    })
  } catch (error) {
    console.error("Error in dependencies API:", error)
    return NextResponse.json(
      {
        success: false,
        error: "An unexpected error occurred",
        dependencies: [],
      },
      { status: 200 }, // Return 200 to avoid triggering error handling
    )
  }
}

// Calculate a security score based on vulnerabilities
function calculateSecurityScore(dependencies: any[]) {
  const totalDeps = dependencies.length
  if (totalDeps === 0) return 100

  const vulnerableDeps = dependencies.filter((d) => d.has_security_update).length
  const outdatedDeps = dependencies.filter((d) => d.outdated).length

  // Calculate score: start with 100 and deduct points
  let score = 100

  // Deduct more for vulnerable dependencies
  score -= (vulnerableDeps / totalDeps) * 50

  // Deduct less for outdated dependencies
  score -= (outdatedDeps / totalDeps) * 20

  // Ensure score is between 0 and 100
  return Math.max(0, Math.min(100, Math.round(score)))
}
