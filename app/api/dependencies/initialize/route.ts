import { NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase-server"
import {
  getDependenciesFromPackageJson,
  getPackageDescriptions,
  getOutdatedPackages,
  getOutdatedPackagesWithNcu,
  getSecurityVulnerabilities,
} from "@/lib/dependency-utils"

export async function POST() {
  try {
    const supabase = createAdminClient()

    // Check if dependencies table exists
    const { data: tableExists, error: tableCheckError } = await supabase.rpc("check_table_exists", {
      table_name: "dependencies",
    })

    if (tableCheckError) {
      console.error("Error checking if dependencies table exists:", tableCheckError)
      return NextResponse.json({ error: "Failed to check if dependencies table exists" }, { status: 500 })
    }

    if (!tableExists) {
      return NextResponse.json(
        { error: "Dependencies table does not exist. Please set up the database first." },
        { status: 400 },
      )
    }

    // Get dependencies from package.json
    const { dependencies, devDependencies } = await getDependenciesFromPackageJson()
    const allDeps = [...dependencies, ...devDependencies]

    // Get package descriptions
    const packageNames = allDeps.map((dep) => dep.name)
    const descriptions = await getPackageDescriptions(packageNames)

    // Get outdated packages
    let outdated = {}
    try {
      outdated = await getOutdatedPackages()
    } catch (error) {
      console.error("Error using npm outdated, trying npm-check-updates:", error)
      try {
        outdated = await getOutdatedPackagesWithNcu()
      } catch (ncuErr) {
        console.error("Error using npm-check-updates:", ncuErr)
        // Continue without outdated info
      }
    }

    // Get security vulnerabilities
    let vulnerabilities = {}
    try {
      vulnerabilities = await getSecurityVulnerabilities()
    } catch (error) {
      console.error("Error getting security vulnerabilities:", error)
      // Continue without vulnerability info
    }

    // Process dependencies in batches to avoid overwhelming the database
    const batchSize = 10
    const batches = []

    for (let i = 0; i < allDeps.length; i += batchSize) {
      batches.push(allDeps.slice(i, i + batchSize))
    }

    for (const batch of batches) {
      const depsToInsert = batch.map((dep) => {
        const outdatedInfo = outdated[dep.name]
        const latestVersion = outdatedInfo?.latest || dep.current_version
        const isOutdated = !!outdatedInfo
        const hasSecurityIssue = vulnerabilities?.vulnerabilities?.[dep.name] !== undefined

        return {
          name: dep.name,
          current_version: dep.current_version,
          latest_version: latestVersion,
          outdated: isOutdated,
          locked: false,
          update_mode: "global",
          has_security_update: hasSecurityIssue,
          is_dev: dep.is_dev,
          description: descriptions[dep.name] || "No description available",
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }
      })

      // Use upsert to handle existing dependencies
      const { error: insertError } = await supabase.from("dependencies").upsert(depsToInsert, { onConflict: "name" })

      if (insertError) {
        console.error("Error inserting dependencies:", insertError)
        return NextResponse.json({ error: "Failed to insert dependencies" }, { status: 500 })
      }
    }

    return NextResponse.json({
      success: true,
      dependenciesCount: allDeps.length,
    })
  } catch (error) {
    console.error("Error initializing dependencies:", error)
    return NextResponse.json(
      {
        error: "Failed to initialize dependencies",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    )
  }
}
