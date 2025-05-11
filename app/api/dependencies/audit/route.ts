import { NextResponse } from "next/server"
import fs from "fs"
import path from "path"
import { exec } from "child_process"
import { promisify } from "util"

const execAsync = promisify(exec)

// Helper function to get dependencies from package.json
async function getDependenciesFromPackageJson() {
  try {
    // Try to read package.json directly from the file system
    const packageJsonPath = path.join(process.cwd(), "package.json")
    const packageJsonContent = fs.readFileSync(packageJsonPath, "utf8")
    const packageJson = JSON.parse(packageJsonContent)

    return {
      dependencies: Object.entries(packageJson.dependencies || {}).map(([name, version]) => ({
        name,
        current_version: version.toString().replace(/^\^|~/, ""),
        is_dev: false,
      })),
      devDependencies: Object.entries(packageJson.devDependencies || {}).map(([name, version]) => ({
        name,
        current_version: version.toString().replace(/^\^|~/, ""),
        is_dev: true,
      })),
    }
  } catch (error) {
    console.error("Error reading package.json:", error)
    return { dependencies: [], devDependencies: [] }
  }
}

export async function POST() {
  try {
    // Get dependencies from package.json
    const { dependencies, devDependencies } = await getDependenciesFromPackageJson()
    const allDeps = [...dependencies, ...devDependencies]

    if (allDeps.length === 0) {
      return NextResponse.json({
        error: "No dependencies found",
        message: "No dependencies found in package.json.",
      })
    }

    // Run npm audit
    let securityIssues = {}
    try {
      const { stdout } = await execAsync("npm audit --json", { timeout: 30000 })
      if (stdout) {
        securityIssues = JSON.parse(stdout)
      }
    } catch (error) {
      // npm audit returns exit code 1 if there are vulnerabilities
      if (error.stdout) {
        try {
          securityIssues = JSON.parse(error.stdout)
        } catch (parseError) {
          console.error("Error parsing npm audit output:", parseError)
        }
      } else {
        console.error("Error running npm audit:", error)
      }
    }

    // Count vulnerabilities
    const vulnerabilitiesCount = Object.keys(securityIssues?.vulnerabilities || {}).length

    // Calculate security score
    const securityScore = Math.max(0, 100 - (vulnerabilitiesCount / Math.max(1, allDeps.length)) * 50)

    return NextResponse.json({
      success: true,
      message: "Security audit completed successfully.",
      vulnerabilities: vulnerabilitiesCount,
      securityScore: securityScore,
      auditSummary: securityIssues,
      lastScan: new Date().toISOString(),
    })
  } catch (error) {
    console.error("Error in audit API:", error)
    return NextResponse.json({
      error: "An unexpected error occurred",
      message: "There was an unexpected error running the security audit.",
      details: error instanceof Error ? error.message : String(error),
    })
  }
}
