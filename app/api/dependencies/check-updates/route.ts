import { NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase-server"
import { checkTableExists } from "@/lib/table-utils"
import { getOutdatedPackages, getOutdatedPackagesWithNcu, getSecurityVulnerabilities } from "@/lib/dependency-utils"

export async function POST() {
  try {
    const supabase = createAdminClient()

    // Check if dependencies table exists
    const dependenciesTableExists = await checkTableExists("dependencies")

    if (!dependenciesTableExists) {
      return NextResponse.json(
        {
          error: "Dependencies table does not exist",
          success: false,
        },
        { status: 404 },
      )
    }

    // Get outdated packages using npm outdated
    let outdatedPackages = {}
    try {
      outdatedPackages = await getOutdatedPackages()
    } catch (error) {
      console.error("Error getting outdated packages with npm outdated:", error)

      // Try with npm-check-updates as fallback
      try {
        outdatedPackages = await getOutdatedPackagesWithNcu()
      } catch (ncuError) {
        console.error("Error getting outdated packages with npm-check-updates:", ncuError)
        // Continue without outdated info
      }
    }

    // Get security vulnerabilities
    let vulnerabilities = {}
    try {
      vulnerabilities = await getSecurityVulnerabilities()
    } catch (error) {
      console.error("Error getting security vulnerabilities:", error)
      // Continue without vulnerability info
    }

    // Get all dependencies from database
    const { data: dependencies, error: fetchError } = await supabase.from("dependencies").select("*")

    if (fetchError) {
      console.error("Error fetching dependencies:", fetchError)
      return NextResponse.json(
        {
          error: "Failed to fetch dependencies",
          success: false,
        },
        { status: 500 },
      )
    }

    // Update dependencies with outdated and vulnerability info
    for (const dep of dependencies || []) {
      const outdatedInfo = outdatedPackages[dep.name]
      const latestVersion = outdatedInfo?.latest || dep.current_version
      const isOutdated = !!outdatedInfo
      const hasSecurityIssue = vulnerabilities?.vulnerabilities?.[dep.name] !== undefined

      // Update dependency in database
      const { error: updateError } = await supabase
        .from("dependencies")
        .update({
          latest_version: latestVersion,
          outdated: isOutdated,
          has_security_update: hasSecurityIssue,
          updated_at: new Date().toISOString(),
        })
        .eq("name", dep.name)

      if (updateError) {
        console.error(`Error updating dependency ${dep.name}:`, updateError)
      }
    }

    // Record the audit
    const { error: auditError } = await supabase.from("security_audits").insert({
      scan_type: "manual",
      vulnerabilities_found: Object.keys(vulnerabilities?.vulnerabilities || {}).length,
      outdated_packages: Object.keys(outdatedPackages).length,
      created_at: new Date().toISOString(),
    })

    if (auditError) {
      console.error("Error recording security audit:", auditError)
    }

    return NextResponse.json({
      success: true,
      outdatedCount: Object.keys(outdatedPackages).length,
      vulnerabilitiesCount: Object.keys(vulnerabilities?.vulnerabilities || {}).length,
    })
  } catch (error) {
    console.error("Error checking for updates:", error)
    return NextResponse.json(
      {
        error: "Failed to check for updates",
        details: error instanceof Error ? error.message : String(error),
        success: false,
      },
      { status: 500 },
    )
  }
}
