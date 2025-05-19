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

        // Determine target version based on update mode and compatibility
        let targetVersion = dependency.latest_version

        if (compatibilityData && updateMode !== "aggressive") {
          // For conservative mode, use the recommended version if available
          if (compatibilityData.recommended_version) {
            targetVersion = compatibilityData.recommended_version
          }

          // Check if target version is in breaking versions
          const breakingVersions = compatibilityData.breaking_versions || {}
          if (breakingVersions[targetVersion] && !forceUpdate) {
            // Skip this update unless forced
            continue
          }
        }

        // Perform the update
        const updateResult = await updateDependency(dependency.name, targetVersion, forceUpdate)

        if (updateResult.success) {
          updatedCount++

          // Update the dependency record
          await supabase
            .from("dependencies")
            .update({
              current_version: targetVersion,
              last_updated: new Date().toISOString(),
              has_security_update: false, // Reset after update
              has_dependabot_alert: false, // Reset after update
            })
            .eq("id", dependency.id)
        }

        updateResults.push({
          name: dependency.name,
          from: dependency.current_version,
          to: targetVersion,
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

async function updateDependency(packageName: string, targetVersion: string, force = false) {
  try {
    // In a real implementation, this would call npm to update the package
    // For this example, we'll simulate a successful update

    // Simulate some failures for testing
    if (packageName.includes("problematic") && !force) {
      return {
        success: false,
        error: "Simulated failure for problematic package",
      }
    }

    // In a real implementation, you would:
    // 1. Run npm update or npm install for the package
    // 2. Run tests to verify the update didn't break anything
    // 3. If tests fail and mode is aggressive, try to fix or revert

    return {
      success: true,
    }
  } catch (error) {
    console.error(`Error updating dependency ${packageName}:`, error)
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    }
  }
}
