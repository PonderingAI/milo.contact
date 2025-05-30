import { NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase-server"

export const dynamic = "force-dynamic"

export async function GET(request: Request) {
  try {
    // This endpoint is meant to be called by a cron job or similar
    // It will check for updates and apply them based on settings

    // 1. Get global update settings
    const supabase = createAdminClient()

    const { data: settingsData, error: settingsError } = await supabase
      .from("dependency_settings")
      .select("*")
      .order("id", { ascending: false })
      .limit(1)
      .single()

    if (settingsError) {
      console.error("Error fetching dependency settings:", settingsError)
      return NextResponse.json(
        {
          error: "Failed to fetch dependency settings",
          details: settingsError.message,
        },
        { status: 500 },
      )
    }

    // If auto-update is disabled, exit early
    if (!settingsData.auto_update_enabled) {
      return NextResponse.json({
        success: true,
        message: "Auto-update is disabled",
        updated: 0,
      })
    }

    const globalUpdateMode = settingsData.update_mode || "aggressive"

    // 2. Get all dependencies
    const { data: dependencies, error: dependenciesError } = await supabase.from("dependencies").select("*")

    if (dependenciesError) {
      console.error("Error fetching dependencies:", dependenciesError)
      return NextResponse.json(
        {
          error: "Failed to fetch dependencies",
          details: dependenciesError.message,
        },
        { status: 500 },
      )
    }

    // 3. Check each dependency for updates
    const updateResults = []
    let updatedCount = 0

    for (const dependency of dependencies) {
      try {
        // Determine the update mode for this dependency
        const updateMode = dependency.update_mode === "global" ? globalUpdateMode : dependency.update_mode

        // Skip if update mode is "off" and there's no security issue
        if (updateMode === "off" && !dependency.has_security_update && !dependency.has_dependabot_alert) {
          continue
        }

        // Always update if there's a security issue or dependabot alert
        const forceUpdate = dependency.has_security_update || dependency.has_dependabot_alert

        // Skip if not outdated and not forced
        if (!dependency.outdated && !forceUpdate) {
          continue
        }

        // Check compatibility data
        await fetchCompatibilityData(dependency.name, dependency.current_version)

        const { data: compatibilityData, error: compatibilityError } = await supabase
          .from("dependency_compatibility")
          .select("*")
          .eq("package_name", dependency.name)
          .maybeSingle()

        let safeUpdateMode: string
        let versionForUpdate: string | undefined
        let versionToCheckForBreaking: string | undefined
        let displayTargetVersion: string // For logging and DB update if successful without specific version return

        if (dependency.has_dependabot_alert) {
          safeUpdateMode = "specific"
          versionForUpdate = dependency.dependabot_recommended_version || undefined
          versionToCheckForBreaking = versionForUpdate // Check the specific version Dependabot wants
          // If dependabot doesn't recommend a version, 'specific' mode will try 'latest'
          // We'll use latest_version for display in this case.
          displayTargetVersion = versionForUpdate || dependency.latest_version 
        } else {
          // Not a Dependabot alert, consider security updates or regular mode
          if (dependency.has_security_update || updateMode === "conservative") {
            safeUpdateMode = "minor"
            versionForUpdate = undefined // safe-update handles 'minor' logic
            // For breaking check, prefer recommended, fallback to latest if conservative,
            // or just latest if it's a security update forcing minor.
            versionToCheckForBreaking = compatibilityData?.recommended_version || dependency.latest_version
            displayTargetVersion = versionToCheckForBreaking 
          } else if (updateMode === "aggressive") {
            safeUpdateMode = "latest"
            versionForUpdate = undefined // safe-update handles 'latest' logic
            versionToCheckForBreaking = dependency.latest_version
            displayTargetVersion = dependency.latest_version
          } else {
            // updateMode is "off" and not forced by an alert, this case should be skipped by earlier checks
            console.warn(`Skipping ${dependency.name} due to unexpected state: updateMode='${updateMode}', forceUpdate=${forceUpdate}`)
            continue
          }
        }
        
        // Check for breaking versions before proceeding
        if (versionToCheckForBreaking && compatibilityData?.breaking_versions?.[versionToCheckForBreaking] && !forceUpdate) {
          console.log(`Skipping update for ${dependency.name} to ${versionToCheckForBreaking} due to breaking version conflict (and not forced).`)
          updateResults.push({
            name: dependency.name,
            from: dependency.current_version,
            to: versionToCheckForBreaking,
            success: false,
            error: `Update to ${versionToCheckForBreaking} skipped due to breaking version conflict.`,
            forcedUpdate: forceUpdate,
            dependabotAlert: dependency.has_dependabot_alert,
          })
          continue
        }

        // Perform the update
        const updateResult = await updateDependency(dependency.name, versionForUpdate, safeUpdateMode)
        
        let actualNewVersion = displayTargetVersion // Fallback for DB update

        if (updateResult.success) {
          updatedCount++
          // Try to get the exact updated version from safe-update's response
          if (updateResult.data?.updatedVersions?.[dependency.name]) {
            actualNewVersion = updateResult.data.updatedVersions[dependency.name]
          } else if (versionForUpdate) {
            // If we sent a specific version and safe-update succeeded, assume that version was installed.
            actualNewVersion = versionForUpdate
          }
          // Else, actualNewVersion remains displayTargetVersion, which is an estimate for 'minor'/'latest' modes

          // Update the dependency record
          await supabase
            .from("dependencies")
            .update({
              current_version: actualNewVersion, // Use the potentially more accurate version
              last_updated: new Date().toISOString(),
              has_security_update: false, // Reset after update
              has_dependabot_alert: false, // Reset after update
            })
            .eq("id", dependency.id)
        }

        updateResults.push({
          name: dependency.name,
          from: dependency.current_version,
          to: actualNewVersion, // Log the version we believe was targeted or installed
          success: updateResult.success,
          error: updateResult.error,
          forcedUpdate: forceUpdate,
          dependabotAlert: dependency.has_dependabot_alert,
        })
      } catch (error) {
        console.error(`Error processing dependency ${dependency.name}:`, error)
        updateResults.push({
          name: dependency.name,
          success: false,
          error: error instanceof Error ? error.message : String(error),
        })
      }
    }

    return NextResponse.json({
      success: true,
      message: `Auto-update completed. Updated ${updatedCount} dependencies.`,
      updated: updatedCount,
      results: updateResults,
    })
  } catch (error) {
    console.error("Error in auto-update service:", error)
    return NextResponse.json(
      {
        error: "An unexpected error occurred",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    )
  }
}

async function fetchCompatibilityData(packageName: string, currentVersion: string) {
  try {
    // Call the API to fetch compatibility data
    const response = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL}/api/dependencies/fetch-compatibility-data`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        packageName,
        version: currentVersion,
      }),
    })

    if (!response.ok) {
      console.error(`Failed to fetch compatibility data for ${packageName}: ${response.statusText}`)
      return null
    }

    return await response.json()
  } catch (error) {
    console.error(`Error fetching compatibility data for ${packageName}:`, error)
    return null
  }
}

async function updateDependency(packageName: string, version: string | undefined, safeUpdateMode: string) {
  try {
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL
    if (!siteUrl) {
      throw new Error("NEXT_PUBLIC_SITE_URL is not set")
    }

    const packagePayload: { name: string; version?: string } = { name: packageName }
    if (version) {
      packagePayload.version = version
    }

    const payload = {
      packages: [packagePayload],
      mode: safeUpdateMode,
    }

    const response = await fetch(`${siteUrl}/api/dependencies/safe-update`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    })

    if (!response.ok) {
      const errorBody = await response.text() // Use text() in case response is not JSON
      console.error(
        `Failed to update dependency ${packageName} via safe-update. Status: ${response.status}. Body: ${errorBody}`,
      )
      return {
        success: false,
        error: `Failed to update dependency ${packageName}: ${response.statusText}. Details: ${errorBody}`,
      }
    }

    const data = await response.json()

    // Assuming the safe-update API returns a structure that indicates overall success
    // and potentially per-package success. For now, let's assume 'data.success' reflects this.
    if (data.success) {
      return {
        success: true,
        data: data,
      }
    } else {
      console.error(`safe-update reported failure for ${packageName}:`, data.error || "No specific error message")
      return {
        success: false,
        error: data.error || `Update for ${packageName} failed as reported by safe-update.`,
        data: data, // include the data for more context
      }
    }
  } catch (error) {
    console.error(`Error calling safe-update for dependency ${packageName}:`, error)
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    }
  }
}
