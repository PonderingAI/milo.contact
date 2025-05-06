import { NextResponse } from "next/server"
import { exec } from "child_process"
import { promisify } from "util"

const execAsync = promisify(exec)

export async function GET() {
  try {
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

    return NextResponse.json({
      success: true,
      vulnerabilities,
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
