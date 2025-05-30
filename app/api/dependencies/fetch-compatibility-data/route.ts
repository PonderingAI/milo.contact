import { NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase-server"

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { packageName, version } = body

    if (!packageName) {
      return NextResponse.json({ error: "Package name is required" }, { status: 400 })
    }

    // Fetch compatibility data from npm
    const npmData = await fetchNpmData(packageName)

    // Fetch compatibility data from GitHub
    const githubData = await fetchGitHubData(packageName)

    // Combine the data
    const combinedData = combineCompatibilityData(packageName, npmData, githubData, version)

    // Save to database
    const supabase = createAdminClient()

    // Check if record already exists
    const { data: existingData, error: existingError } = await supabase
      .from("dependency_compatibility")
      .select("id")
      .eq("package_name", packageName)
      .maybeSingle()

    if (existingError) {
      console.error("Error checking for existing record:", existingError)
      return NextResponse.json(
        {
          error: "Failed to check for existing record",
          details: existingError.message,
        },
        { status: 500 },
      )
    }

    const now = new Date().toISOString()

    let result
    if (existingData) {
      // Update existing record
      const { data, error } = await supabase
        .from("dependency_compatibility")
        .update({
          min_compatible_version: combinedData.minCompatibleVersion,
          max_compatible_version: combinedData.maxCompatibleVersion,
          recommended_version: combinedData.recommendedVersion,
          compatibility_notes: combinedData.compatibilityNotes,
          breaking_versions: combinedData.breakingVersions,
          source: combinedData.source,
          updated_at: now,
        })
        .eq("id", existingData.id)
        .select()

      result = { data, error, isNew: false }
    } else {
      // Insert new record
      const { data, error } = await supabase
        .from("dependency_compatibility")
        .insert({
          package_name: packageName,
          min_compatible_version: combinedData.minCompatibleVersion,
          max_compatible_version: combinedData.maxCompatibleVersion,
          recommended_version: combinedData.recommendedVersion,
          compatibility_notes: combinedData.compatibilityNotes,
          breaking_versions: combinedData.breakingVersions,
          source: combinedData.source,
          verified_by: "Automatic System",
          created_at: now,
          updated_at: now,
        })
        .select()

      result = { data, error, isNew: true }
    }

    if (result.error) {
      console.error("Error saving compatibility data:", result.error)
      return NextResponse.json(
        {
          error: "Failed to save compatibility data",
          details: result.error.message,
        },
        { status: 500 },
      )
    }

    return NextResponse.json({
      success: true,
      data: combinedData,
      databaseRecord: result.data[0],
      message: result.isNew ? "Compatibility record created" : "Compatibility record updated",
    })
  } catch (error) {
    console.error("Error in fetch-compatibility-data API:", error)
    return NextResponse.json(
      {
        error: "An unexpected error occurred",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    )
  }
}

async function fetchNpmData(packageName: string) {
  try {
    // Fetch package data from npm registry
    const response = await fetch(`https://registry.npmjs.org/${packageName}`)

    if (!response.ok) {
      console.error(`Failed to fetch npm data for ${packageName}: ${response.statusText}`)
      return null
    }

    const data = await response.json()

    // Extract useful information
    const latestVersion = data["dist-tags"]?.latest
    const versions = Object.keys(data.versions || {})
    const timeData = data.time || {}

    // Get deprecation notices
    const deprecatedVersions = {}
    for (const [version, versionData] of Object.entries(data.versions || {})) {
      if (versionData.deprecated) {
        deprecatedVersions[version] = versionData.deprecated
      }
    }

    // Get readme for potential compatibility information
    const readme = data.readme || ""

    return {
      latestVersion,
      versions,
      timeData,
      deprecatedVersions,
      readme,
    }
  } catch (error) {
    console.error(`Error fetching npm data for ${packageName}:`, error)
    return null
  }
}

async function fetchGitHubData(packageName: string) {
  try {
    // Try to find GitHub repository from package name
    // This is a simplified approach - in reality, you'd need to parse the npm data to find the repo URL
    const repoName = packageName.includes("/") ? packageName : packageName

    // Fetch issues that might indicate compatibility problems
    const issuesResponse = await fetch(
      `https://api.github.com/search/issues?q=repo:${repoName}+label:compatibility+state:open`,
    )

    if (!issuesResponse.ok) {
      console.error(`Failed to fetch GitHub issues for ${packageName}: ${issuesResponse.statusText}`)
      return null
    }

    const issuesData = await issuesResponse.json()

    // Fetch release notes
    const releasesResponse = await fetch(`https://api.github.com/repos/${repoName}/releases`)

    let releasesData = []
    if (releasesResponse.ok) {
      releasesData = await releasesResponse.json()
    }

    return {
      compatibilityIssues: issuesData.items || [],
      releases: releasesData,
    }
  } catch (error) {
    console.error(`Error fetching GitHub data for ${packageName}:`, error)
    return null
  }
}

function combineCompatibilityData(packageName: string, npmData, githubData, currentVersion: string) {
  // Default values
  const result = {
    packageName,
    minCompatibleVersion: null,
    maxCompatibleVersion: null,
    recommendedVersion: null,
    compatibilityNotes: "",
    breakingVersions: {},
    source: "auto",
  }

  // Process npm data
  if (npmData) {
    // Set recommended version to latest stable
    result.recommendedVersion = npmData.latestVersion

    // Add deprecated versions to breaking versions
    if (npmData.deprecatedVersions && Object.keys(npmData.deprecatedVersions).length > 0) {
      result.breakingVersions = npmData.deprecatedVersions
    }

    // Try to extract compatibility information from readme
    if (npmData.readme) {
      const compatibilityMatches = npmData.readme.match(/compatibility|compatible with|works with|requires/gi)
      if (compatibilityMatches && compatibilityMatches.length > 0) {
        // Extract sentences containing compatibility information
        const sentences = npmData.readme.split(/[.!?]/)
        const compatibilitySentences = sentences.filter((sentence) =>
          compatibilityMatches.some((match) => sentence.toLowerCase().includes(match.toLowerCase())),
        )

        if (compatibilitySentences.length > 0) {
          result.compatibilityNotes += "From npm documentation:\n" + compatibilitySentences.join(". ") + ".\n\n"
        }
      }
    }
  }

  // Process GitHub data
  if (githubData) {
    // Extract compatibility issues
    if (githubData.compatibilityIssues && githubData.compatibilityIssues.length > 0) {
      result.compatibilityNotes += "Compatibility issues from GitHub:\n"

      githubData.compatibilityIssues.forEach((issue) => {
        // Try to extract version information from issue title or body
        const versionMatch = (issue.title + " " + (issue.body || "")).match(/v?(\d+\.\d+\.\d+)/i)
        if (versionMatch) {
          const version = versionMatch[1]
          result.breakingVersions[version] = issue.title
        }

        result.compatibilityNotes += `- ${issue.title} (${issue.html_url})\n`
      })

      result.compatibilityNotes += "\n"
    }

    // Extract information from release notes
    if (githubData.releases && githubData.releases.length > 0) {
      // Look for breaking changes in release notes
      githubData.releases.forEach((release) => {
        if (release.body && release.body.toLowerCase().includes("breaking change")) {
          const version = release.tag_name.replace(/^v/, "")
          result.breakingVersions[version] = "Breaking changes mentioned in release notes"

          result.compatibilityNotes += `Breaking changes in version ${version}:\n`

          // Extract the breaking changes section
          const breakingChangesMatch = release.body.match(/breaking changes?:(.*?)(?=##|\n\n|$)/is)
          if (breakingChangesMatch) {
            result.compatibilityNotes += breakingChangesMatch[1].trim() + "\n\n"
          } else {
            result.compatibilityNotes += "See release notes for details.\n\n"
          }
        }
      })
    }
  }

  // If we have a current version and no breaking versions include it, consider it compatible
  if (currentVersion && !result.breakingVersions[currentVersion]) {
    result.minCompatibleVersion = currentVersion
  }

  // If we have a recommended version and no breaking versions include it, set max compatible
  if (result.recommendedVersion && !result.breakingVersions[result.recommendedVersion]) {
    result.maxCompatibleVersion = result.recommendedVersion
  }

  return result
}
