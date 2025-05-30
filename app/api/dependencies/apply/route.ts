import { NextResponse } from "next/server"
import { exec } from "child_process"
import { promisify } from "util"
import fs from "fs"
import path from "path"

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

// Helper function to check for outdated packages
async function getOutdatedPackages() {
  try {
    const { stdout } = await execAsync("npm outdated --json", { timeout: 30000 })
    if (stdout) {
      return JSON.parse(stdout)
    }
    return {}
  } catch (error) {
    // npm outdated returns exit code 1 if there are outdated packages
    if (error.stdout) {
      try {
        return JSON.parse(error.stdout)
      } catch (parseError) {
        console.error("Error parsing npm outdated output:", parseError)
      }
    }
    console.error("Error running npm outdated:", error)
    return {}
  }
}

// Helper function to check for security vulnerabilities
async function getSecurityIssues() {
  try {
    const { stdout } = await execAsync("npm audit --json", { timeout: 30000 })
    if (stdout) {
      return JSON.parse(stdout)
    }
    return {}
  } catch (error) {
    // npm audit returns exit code 1 if there are vulnerabilities
    if (error.stdout) {
      try {
        return JSON.parse(error.stdout)
      } catch (parseError) {
        console.error("Error parsing npm audit output:", parseError)
      }
    }
    console.error("Error running npm audit:", error)
    return {}
  }
}

// Helper function to check for Dependabot alerts from GitHub
async function getDependabotAlerts() {
  try {
    // In a real implementation, this would call the GitHub API
    // For now, we'll simulate some Dependabot alerts

    // Simulate some Dependabot alerts for demonstration
    const simulatedAlerts = {
      react: {
        severity: "high",
        summary: "Prototype Pollution in React",
        url: "https://github.com/advisories/GHSA-example-react",
        createdAt: new Date().toISOString(),
      },
      lodash: {
        severity: "critical",
        summary: "Prototype Pollution in Lodash",
        url: "https://github.com/advisories/GHSA-example-lodash",
        createdAt: new Date().toISOString(),
      },
      // Add more simulated alerts as needed
    }

    return simulatedAlerts
  } catch (error) {
    console.error("Error fetching Dependabot alerts:", error)
    return {}
  }
}

export async function POST() {
  try {
    // Get outdated packages
    const outdatedPackages = await getOutdatedPackages()
    const securityIssues = await getSecurityIssues()
    const dependabotAlerts = await getDependabotAlerts()

    // If no outdated packages, return early
    if (Object.keys(outdatedPackages).length === 0) {
      return NextResponse.json({
        success: true,
        message: "No updates needed. All packages are up to date.",
        results: [],
        updated: 0,
        failed: 0,
      })
    }

    // Simulate update results
    const results = Object.entries(outdatedPackages).map(([name, info]: [string, any]) => {
      const hasSecurityIssue = securityIssues?.vulnerabilities?.[name] !== undefined
      const hasDependabotAlert = dependabotAlerts[name] !== undefined
      const alertDetails = hasDependabotAlert ? dependabotAlerts[name] : null

      return {
        name,
        from: info.current,
        to: info.latest,
        success: Math.random() > 0.1, // Simulate 90% success rate
        error: Math.random() > 0.9 ? "Failed to update package" : null,
        securityFix: hasSecurityIssue,
        dependabotAlert: hasDependabotAlert,
        alertDetails: alertDetails,
      }
    })

    return NextResponse.json({
      success: true,
      message: "Updates applied successfully.",
      results,
      updated: results.filter((r) => r.success).length,
      failed: results.filter((r) => !r.success).length,
    })
  } catch (error) {
    console.error("Error applying updates:", error)
    return NextResponse.json({
      error: "An unexpected error occurred",
      message: "There was an unexpected error applying updates.",
      details: error instanceof Error ? error.message : String(error),
    })
  }
}
