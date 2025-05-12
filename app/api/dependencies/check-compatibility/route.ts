import { NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase-server"
import semver from "semver"

// Helper function to check if a version is compatible
function isVersionCompatible(version, minVersion, maxVersion) {
  // If no constraints, assume compatible
  if (!minVersion && !maxVersion) return true

  // Clean versions to ensure they're valid semver
  const cleanVersion = semver.valid(semver.coerce(version))
  const cleanMinVersion = minVersion ? semver.valid(semver.coerce(minVersion)) : null
  const cleanMaxVersion = maxVersion ? semver.valid(semver.coerce(maxVersion)) : null

  if (!cleanVersion) return false

  // Check minimum version constraint
  if (cleanMinVersion && semver.lt(cleanVersion, cleanMinVersion)) {
    return false
  }

  // Check maximum version constraint
  if (cleanMaxVersion && semver.gt(cleanVersion, cleanMaxVersion)) {
    return false
  }

  return true
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { packages } = body

    if (!packages || !Array.isArray(packages) || packages.length === 0) {
      return NextResponse.json({ error: "Packages array is required" }, { status: 400 })
    }

    const supabase = createAdminClient()

    // Get compatibility data for all packages in one query
    const { data: compatibilityData, error } = await supabase
      .from("dependency_compatibility")
      .select("*")
      .in(
        "package_name",
        packages.map((p) => p.name),
      )

    if (error) {
      console.error("Error fetching compatibility data:", error)
      return NextResponse.json(
        {
          error: "Failed to fetch compatibility data",
          details: error.message,
        },
        { status: 500 },
      )
    }

    // Map the results
    const results = packages.map((pkg) => {
      const compatRecord = compatibilityData?.find((r) => r.package_name === pkg.name)

      if (!compatRecord) {
        return {
          name: pkg.name,
          currentVersion: pkg.currentVersion,
          targetVersion: pkg.targetVersion,
          compatible: null, // No data available
          needsTesting: true,
          recommended: null,
          notes: null,
        }
      }

      const isCompatible = isVersionCompatible(
        pkg.targetVersion,
        compatRecord.min_compatible_version,
        compatRecord.max_compatible_version,
      )

      // Check if targetVersion is in breaking_versions
      const breakingVersionInfo = compatRecord.breaking_versions?.[pkg.targetVersion]

      return {
        name: pkg.name,
        currentVersion: pkg.currentVersion,
        targetVersion: pkg.targetVersion,
        compatible: breakingVersionInfo ? false : isCompatible,
        needsTesting: breakingVersionInfo ? false : isCompatible === null,
        recommended: compatRecord.recommended_version,
        notes: breakingVersionInfo ? `Breaking version: ${breakingVersionInfo}` : compatRecord.compatibility_notes,
        lastVerified: compatRecord.last_verified_date,
        breakingReason: breakingVersionInfo,
      }
    })

    return NextResponse.json({
      success: true,
      results,
      needsTesting: results.some((r) => r.needsTesting),
    })
  } catch (error) {
    console.error("Error in check-compatibility API:", error)
    return NextResponse.json(
      {
        error: "An unexpected error occurred",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    )
  }
}
