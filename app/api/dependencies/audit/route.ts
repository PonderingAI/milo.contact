import { NextResponse } from "next/server"
import { getSecurityVulnerabilities } from "@/lib/dependency-utils"
import { createAdminClient } from "@/lib/supabase-server"

export async function GET() {
  try {
    // Run security audit
    const auditData = await getSecurityVulnerabilities()

    // Extract the vulnerabilities
    const vulnerabilities = auditData.vulnerabilities || {}
    const metadata = auditData.metadata || {}

    // Calculate security score (100 - percentage of vulnerable dependencies)
    const totalDependencies = metadata.totalDependencies || 1 // Avoid division by zero
    const vulnerableCount = Object.keys(vulnerabilities).length
    const securityScore = Math.max(0, Math.min(100, 100 - (vulnerableCount / totalDependencies) * 100))

    // Store audit results in database if it exists
    const supabase = createAdminClient()

    // Check if security_audits table exists
    const { data: tableExists, error: checkError } = await supabase.rpc("check_table_exists", {
      table_name: "security_audits",
    })

    if (!checkError && tableExists) {
      // Insert audit results
      const { error: insertError } = await supabase.from("security_audits").insert({
        audit_date: new Date().toISOString(),
        vulnerabilities_found: vulnerableCount,
        packages_scanned: totalDependencies,
        security_score: Math.round(securityScore),
        audit_summary: auditData,
      })

      if (insertError) {
        console.error("Error inserting security audit:", insertError)
      }
    }

    return NextResponse.json({
      success: true,
      vulnerabilities,
      metadata,
      securityScore: Math.round(securityScore),
      vulnerableCount,
    })
  } catch (error) {
    console.error("Error running security audit:", error)

    return NextResponse.json(
      {
        error: "Failed to run security audit",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    )
  }
}

export async function POST() {
  // POST method for running an audit and storing results
  return GET()
}
