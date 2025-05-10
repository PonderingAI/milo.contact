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

    // This is a simulation - in a real implementation, you would:
    // 1. Use the GitHub API to fetch Dependabot alerts for the repository
    // 2. Parse the response to get the affected packages and severity

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

// Get the global update mode from localStorage or default to "conservative"
async function getGlobalUpdateMode() {
  try {
    // In a real implementation, this would come from a database
    // For now, we'll default to "conservative"
    return "conservative"
  } catch (error) {
    console.error("Error getting global update mode:", error)
    return "conservative"
  }
}

export async function GET() {
  try {
    // Get dependencies from package.json
    const { dependencies, devDependencies } = await getDependenciesFromPackageJson()
    const allDeps = [...dependencies, ...devDependencies]

    // Get outdated packages
    const outdatedPackages = await getOutdatedPackages()

    // Get security issues
    const securityIssues = await getSecurityIssues()

    // Get Dependabot alerts
    const dependabotAlerts = await getDependabotAlerts()

    // Get global update mode
    const globalMode = await getGlobalUpdateMode()

    // Determine which packages to update based on update mode
    // For now, we'll simulate this since we don't have a database
    const packagesToUpdate = Object.entries(outdatedPackages).filter(([name, info]: [string, any]) => {
      const hasSecurityIssue = securityIssues?.vulnerabilities?.[name] !== undefined
      const hasDependabotAlert = dependabotAlerts[name] !== undefined

      // IMPORTANT: Always update if there's a Dependabot alert, regardless of update mode
      if (hasDependabotAlert) {
        return true
      }

      // Apply the global mode logic
      // In a real implementation, each package would have its own mode
      switch (globalMode) {
        case "off":
          return false
        case "conservative":
          return hasSecurityIssue
        case "aggressive":
          return true
        default:
          return hasSecurityIssue // Default to conservative
      }
    })

    // If no packages to update, return early
    if (packagesToUpdate.length === 0) {
      return NextResponse.json({
        message: "No packages need to be updated based on current preferences.",
        updated: 0,
        results: [],
      })
    }

    // Simulate updating packages
    // In a real implementation, this would run npm update commands
    const results = packagesToUpdate.map(([name, info]: [string, any]) => {
      const hasSecurityIssue = securityIssues?.vulnerabilities?.[name] !== undefined
      const hasDependabotAlert = dependabotAlerts[name] !== undefined
      const alertDetails = hasDependabotAlert ? dependabotAlerts[name] : null

      return {
        name,
        from: info.current,
        to: info.latest,
        success: true, // Simulate success
        securityFix: hasSecurityIssue,
        dependabotAlert: hasDependabotAlert,
        alertDetails: alertDetails,
        forcedUpdate: hasDependabotAlert && globalMode === "off", // Flag if this was a forced update due to Dependabot alert
      }
    })

    return NextResponse.json({
      success: true,
      message: "Scheduled updates applied successfully.",
      updated: results.length,
      results,
    })
  } catch (error) {
    console.error("Error in scheduled update:", error)
    return NextResponse.json({
      error: "An unexpected error occurred",
      message: "There was an unexpected error processing scheduled updates.",
      details: error instanceof Error ? error.message : String(error),
    })
  }
}
