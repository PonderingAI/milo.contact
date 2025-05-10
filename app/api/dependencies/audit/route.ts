import { NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase-server"
import { exec } from "child_process"
import { promisify } from "util"

const execAsync = promisify(exec)

export async function POST() {
  try {
    const supabase = createAdminClient()

    // Run npm audit --json to get security vulnerabilities
    const { stdout } = await execAsync("npm audit --json", { timeout: 30000 })

    // Parse the JSON output
    const auditData = JSON.parse(stdout)

    // Extract the vulnerabilities
    const vulnerabilities = auditData.vulnerabilities || {}
    const metadata = auditData.metadata || {}

    // Calculate security score (100 - percentage of vulnerable dependencies)
    const totalDependencies = metadata.totalDependencies || 1 // Avoid division by zero
    const vulnerableCount = Object.keys(vulnerabilities).length
    const securityScore = Math.max(0, Math.min(100, 100 - (vulnerableCount / totalDependencies) * 100))

    // Update dependencies with security information
    for (const [name, details] of Object.entries(vulnerabilities)) {
      await supabase
        .from("dependencies")
        .update({
          has_security_issue: true,
          security_details: details,
          updated_at: new Date().toISOString(),
        })
        .eq("name", name)
    }

    // Insert audit record
    await supabase.from("security_audits").insert({
      audit_date: new Date().toISOString(),
      vulnerabilities_found: vulnerableCount,
      packages_scanned: totalDependencies,
      security_score: Math.round(securityScore),
      audit_summary: auditData,
    })

    // Update last scan time in dependency_settings
    await supabase.from("dependency_settings").update({ last_scan: new Date().toISOString() }).eq("id", 1)

    return NextResponse.json({
      success: true,
      vulnerabilities: vulnerableCount,
      metadata,
      securityScore: Math.round(securityScore),
      vulnerableCount,
    })
  } catch (error) {
    console.error("Error running security audit:", error)

    // If the command fails but returns data about vulnerabilities
    if (error instanceof Error && "stdout" in error) {
      try {
        const auditData = JSON.parse((error as any).stdout)
        const vulnerabilities = auditData.vulnerabilities || {}
        const metadata = auditData.metadata || {}
        const totalDependencies = metadata.totalDependencies || 1
        const vulnerableCount = Object.keys(vulnerabilities).length
        const securityScore = Math.max(0, Math.min(100, 100 - (vulnerableCount / totalDependencies) * 100))

        // Update dependencies with security information
        const supabase = createAdminClient()
        for (const [name, details] of Object.entries(vulnerabilities)) {
          await supabase
            .from("dependencies")
            .update({
              has_security_issue: true,
              security_details: details,
              updated_at: new Date().toISOString(),
            })
            .eq("name", name)
        }

        // Insert audit record
        await supabase.from("security_audits").insert({
          audit_date: new Date().toISOString(),
          vulnerabilities_found: vulnerableCount,
          packages_scanned: totalDependencies,
          security_score: Math.round(securityScore),
          audit_summary: auditData,
        })

        // Update last scan time in dependency_settings
        await supabase.from("dependency_settings").update({ last_scan: new Date().toISOString() }).eq("id", 1)

        return NextResponse.json({
          success: true,
          vulnerabilities,
          metadata,
          securityScore: Math.round(securityScore),
          vulnerableCount,
        })
      } catch (parseError) {
        // If parsing fails, continue to the error response
      }
    }

    return NextResponse.json(
      {
        error: "Failed to run security audit",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    )
  }
}
