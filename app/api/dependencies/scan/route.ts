import { NextResponse } from "next/server"
import { getRouteHandlerSupabaseClient, checkAdminPermission } from "@/lib/auth-server"
import { auth } from "@clerk/nextjs/server"
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

// Helper function to fetch package info from npm
async function fetchPackageInfo(packageName) {
  try {
    // Use the full metadata to ensure we get accurate version information
    const response = await fetch(`https://registry.npmjs.org/${packageName}`, {
      headers: {
        Accept: "application/json", // Get full metadata for accurate version info
      },
      cache: "no-store", // Don't use cached data to ensure we get the latest
    })

    if (!response.ok) {
      throw new Error(`Failed to fetch package info: ${response.status}`)
    }

    const data = await response.json()

    // Extract the latest version
    const latestVersion = data["dist-tags"]?.latest

    // Get description and repository info
    const description = data.description || ""
    const repository =
      typeof data.repository === "object"
        ? data.repository.url
        : typeof data.repository === "string"
          ? data.repository
          : ""

    // Clean up repository URL
    let repoUrl = ""
    if (repository) {
      repoUrl = repository
        .replace(/^git\+/, "")
        .replace(/\.git$/, "")
        .replace(/^git:\/\//, "https://")
        .replace(/^ssh:\/\/git@/, "https://")
    }

    return {
      description,
      repository: repoUrl,
      latestVersion,
      homepage: data.homepage || "",
      license: data.license || "Unknown",
      author: data.author ? (typeof data.author === "object" ? data.author.name : data.author) : "Unknown",
    }
  } catch (error) {
    console.error(`Error fetching info for ${packageName}:`, error)
    return {
      description: "",
      repository: "",
      latestVersion: "",
      homepage: "",
      license: "Unknown",
      author: "Unknown",
    }
  }
}

export async function POST() {
  try {
    // Check if user is authenticated
    const { userId } = auth()
    if (!userId) {
      return NextResponse.json({ 
        error: "Unauthorized", 
        message: "You must be signed in to scan dependencies" 
      }, { status: 401 })
    }
    
    // Get authenticated Supabase client that syncs Clerk with Supabase
    const supabase = await getRouteHandlerSupabaseClient()
    
    // Check if user has admin role via Clerk metadata
    const hasAdminPermission = await checkAdminPermission(userId)
    
    if (!hasAdminPermission) {
      return NextResponse.json({ 
        error: "Permission denied", 
        message: "Admin role required to scan dependencies"
      }, { status: 403 })
    }
    // Get dependencies from package.json
    const { dependencies, devDependencies } = await getDependenciesFromPackageJson()
    const allDeps = [...dependencies, ...devDependencies]

    if (allDeps.length === 0) {
      return NextResponse.json(
        {
          error: "No dependencies found",
          message: "No dependencies found in package.json.",
          dependencies: [],
        },
        { status: 404 },
      )
    }

    // Try to get outdated packages using npm
    let outdatedPackages = {}
    try {
      const { stdout } = await execAsync("npm outdated --json", { timeout: 30000 })
      if (stdout) {
        outdatedPackages = JSON.parse(stdout)
      }
    } catch (error) {
      // npm outdated returns exit code 1 if there are outdated packages
      if (error.stdout) {
        try {
          outdatedPackages = JSON.parse(error.stdout)
        } catch (parseError) {
          console.error("Error parsing npm outdated output:", parseError)
        }
      } else {
        console.error("Error running npm outdated:", error)
      }
    }

    // Try to get security vulnerabilities using npm audit
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

    // Fetch package info for each dependency (limit to 5 concurrent requests to avoid rate limiting)
    const packageInfos = []
    const batchSize = 5

    for (let i = 0; i < allDeps.length; i += batchSize) {
      const batch = allDeps.slice(i, i + batchSize)
      const batchResults = await Promise.all(batch.map((dep) => fetchPackageInfo(dep.name)))

      for (let j = 0; j < batch.length; j++) {
        packageInfos.push({
          ...batch[j],
          ...batchResults[j],
        })
      }
    }

    // Count vulnerabilities
    const vulnerabilitiesCount = Object.keys(securityIssues?.vulnerabilities || {}).length
    const outdatedCount = Object.keys(outdatedPackages).length

    return NextResponse.json({
      success: true,
      message: "Dependencies scanned successfully.",
      dependenciesCount: allDeps.length,
      outdatedCount: outdatedCount,
      vulnerabilitiesCount: vulnerabilitiesCount,
      lastScan: new Date().toISOString(),
      packageInfos: packageInfos.length,
    })
  } catch (error) {
    console.error("Error in scan API:", error)
    return NextResponse.json(
      {
        error: "An unexpected error occurred",
        message: "There was an unexpected error scanning dependencies.",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    )
  }
}
