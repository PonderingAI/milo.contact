import { NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase-server"
import { runDependencyScan } from "@/lib/dependency-utils"

export async function GET() {
  try {
    const supabase = createAdminClient()

    // Check if dependencies table exists
    const { data: tableExists, error: tableCheckError } = await supabase.rpc("check_table_exists", {
      table_name: "dependencies",
    })

    if (tableCheckError) {
      console.error("Error checking if dependencies table exists:", tableCheckError)
      return NextResponse.json({ error: "Failed to check if dependencies table exists" }, { status: 500 })
    }

    if (!tableExists) {
      // Return empty data instead of an error
      return NextResponse.json({
        dependencies: [],
        vulnerabilities: 0,
        outdatedPackages: 0,
        securityScore: 100,
        lastScan: new Date().toISOString(),
        setupNeeded: true,
      })
    }

    // Get dependencies from database
    const { data: dependencies, error: fetchError } = await supabase.from("dependencies").select("*").order("name")

    if (fetchError) {
      console.error("Error fetching dependencies:", fetchError)
      return NextResponse.json({ error: "Failed to fetch dependencies" }, { status: 500 })
    }

    // If no dependencies in database, run a scan
    if (!dependencies || dependencies.length === 0) {
      try {
        const scanResult = await runDependencyScan()

        // Get the updated dependencies from database
        const { data: updatedDeps, error: updatedFetchError } = await supabase
          .from("dependencies")
          .select("*")
          .order("name")

        if (updatedFetchError) {
          console.error("Error fetching updated dependencies:", updatedFetchError)
          return NextResponse.json({
            dependencies: scanResult.dependencies,
            vulnerabilities: scanResult.vulnerabilities,
            outdatedPackages: scanResult.outdatedPackages,
            securityScore: scanResult.securityScore,
            lastScan: scanResult.lastScan,
          })
        }

        return NextResponse.json({
          dependencies: updatedDeps,
          vulnerabilities: scanResult.vulnerabilities,
          outdatedPackages: scanResult.outdatedPackages,
          securityScore: scanResult.securityScore,
          lastScan: scanResult.lastScan,
        })
      } catch (scanError) {
        console.error("Error running dependency scan:", scanError)
        return NextResponse.json({ error: "Failed to run dependency scan" }, { status: 500 })
      }
    }

    // Count vulnerabilities and outdated packages
    const vulnerabilities = dependencies.filter((dep) => dep.has_security_update).length
    const outdatedPackages = dependencies.filter((dep) => dep.outdated).length

    // Get global update mode
    const { data: settings, error: settingsError } = await supabase.from("dependency_settings").select("*").single()

    const updateMode = settings?.update_mode || "conservative"

    // Calculate security score
    const totalDeps = dependencies.length
    let securityScore = 100

    if (totalDeps > 0) {
      const vulnerableDeps = dependencies.filter((d) => d.has_security_update).length
      const outdatedDeps = dependencies.filter((d) => d.outdated).length

      // Deduct more for vulnerable dependencies
      securityScore -= (vulnerableDeps / totalDeps) * 50

      // Deduct less for outdated dependencies
      securityScore -= (outdatedDeps / totalDeps) * 20

      // Ensure score is between 0 and 100
      securityScore = Math.max(0, Math.min(100, Math.round(securityScore)))
    }

    // Get last scan time
    const { data: lastAudit, error: auditError } = await supabase
      .from("security_audits")
      .select("created_at")
      .order("created_at", { ascending: false })
      .limit(1)
      .single()

    const lastScan = lastAudit?.created_at || new Date().toISOString()

    return NextResponse.json({
      dependencies,
      vulnerabilities,
      outdatedPackages,
      securityScore,
      updateMode,
      lastScan,
    })
  } catch (error) {
    console.error("Error fetching dependencies:", error)
    return NextResponse.json(
      {
        error: "Failed to fetch dependencies",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    )
  }
}
