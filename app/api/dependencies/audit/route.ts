import { NextResponse } from "next/server"
import { exec } from "child_process"
import { promisify } from "util"
import { createAdminClient } from "@/lib/supabase-server"

const execAsync = promisify(exec)

// Function to run npm audit
async function runNpmAudit() {
  try {
    const { stdout } = await execAsync("npm audit --json")
    return JSON.parse(stdout)
  } catch (error) {
    // npm audit returns non-zero exit code when vulnerabilities are found
    if (error instanceof Error && "stdout" in error) {
      try {
        return JSON.parse(error.stdout as string)
      } catch (parseError) {
        console.error("Error parsing npm audit output:", parseError)
      }
    }
    console.error("Error running npm audit:", error)
    return { vulnerabilities: {} }
  }
}

// Calculate security score based on vulnerabilities
function calculateSecurityScore(auditData: any) {
  if (!auditData || !auditData.vulnerabilities) return 100

  const vulnerabilities = auditData.vulnerabilities
  const vulnCount = Object.keys(vulnerabilities).length

  if (vulnCount === 0) return 100

  let totalDeductions = 0

  // Count vulnerabilities by severity
  const severityCounts = {
    critical: 0,
    high: 0,
    moderate: 0,
    low: 0,
  }

  for (const vuln of Object.values(vulnerabilities) as any[]) {
    severityCounts[vuln.severity] = (severityCounts[vuln.severity] || 0) + 1
  }

  // Deduct points based on vulnerability severity
  totalDeductions += severityCounts.critical * 15
  totalDeductions += severityCounts.high * 10
  totalDeductions += severityCounts.moderate * 5
  totalDeductions += severityCounts.low * 2

  // Calculate final score (minimum 0)
  const score = Math.max(0, 100 - totalDeductions)

  // Return rounded score
  return Math.round(score)
}

export async function POST() {
  try {
    const supabase = createAdminClient()

    // Run npm audit
    const auditData = await runNpmAudit()

    // Calculate security score
    const securityScore = calculateSecurityScore(auditData)

    // Count vulnerabilities
    const vulnerabilities = auditData.vulnerabilities ? Object.keys(auditData.vulnerabilities).length : 0

    // Update database with audit results
    const { error } = await supabase.from("security_audits").insert({
      score: securityScore,
      vulnerabilities: vulnerabilities,
      audit_data: auditData,
      created_at: new Date().toISOString(),
    })

    if (error) {
      console.error("Error saving audit results:", error)
    }

    return NextResponse.json({
      success: true,
      securityScore,
      vulnerabilities,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error("Error running security audit:", error)
    return NextResponse.json(
      { error: "Failed to run security audit", details: error instanceof Error ? error.message : String(error) },
      { status: 500 },
    )
  }
}
