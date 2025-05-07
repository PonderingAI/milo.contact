import { NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase-server"
import { runDependencyScan, getDependenciesFromPackageJson, getPackageDescriptions } from "@/lib/dependency-utils"

export async function GET() {
  try {
    const supabase = createAdminClient()

    // Check if dependencies table exists
    const { data: tableExists, error: tableCheckError } = await supabase.rpc("check_table_exists", {
      table_name: "dependencies",
    })

    if (tableCheckError) {
      console.error("Error checking if dependencies table exists:", tableCheckError)
      return NextResponse.json(
        {
          error: "Failed to check if dependencies table exists",
          details: tableCheckError.message,
        },
        { status: 500 },
      )
    }

    // Run a full dependency scan
    const scanResult = await runDependencyScan()

    // If table doesn't exist, return dependencies from scan without database info
    if (!tableExists) {
      return NextResponse.json({
        dependencies: scanResult.dependencies,
        vulnerabilities: scanResult.vulnerabilities,
        outdatedPackages: scanResult.outdatedPackages,
        securityScore: scanResult.securityScore,
        lastScan: scanResult.lastScan,
        tableExists: false,
        setupNeeded: true,
        setupMessage: "Dependencies tables not set up. Using package.json data.",
      })
    }

    // Get all dependencies from database with their settings
    const { data: dbDeps, error: fetchError } = await supabase.from("dependencies").select("*")

    if (fetchError) {
      console.error("Error fetching dependencies from database:", fetchError)
      return NextResponse.json(
        {
          error: "Failed to fetch dependencies from database",
          details: fetchError.message,
          dependencies: scanResult.dependencies, // Return scan data as fallback
          vulnerabilities: scanResult.vulnerabilities,
          outdatedPackages: scanResult.outdatedPackages,
          securityScore: scanResult.securityScore,
          lastScan: scanResult.lastScan,
        },
        { status: 500 },
      )
    }

    // Get global update mode from settings
    const { data: settings, error: settingsError } = await supabase
      .from("dependency_settings")
      .select("update_mode")
      .limit(1)
      .single()

    const globalMode = settingsError ? "conservative" : settings?.update_mode || "conservative"

    return NextResponse.json({
      dependencies: dbDeps || scanResult.dependencies,
      vulnerabilities: scanResult.vulnerabilities,
      outdatedPackages: scanResult.outdatedPackages,
      securityScore: scanResult.securityScore,
      lastScan: scanResult.lastScan,
      updateMode: globalMode,
      tableExists: true,
    })
  } catch (error) {
    console.error("Error in dependencies API:", error)

    // Try to get dependencies from package.json as fallback
    try {
      const { dependencies, devDependencies } = await getDependenciesFromPackageJson()
      const allDeps = [...dependencies, ...devDependencies]

      // Get package descriptions
      const packageNames = allDeps.map((dep) => dep.name)
      const descriptions = await getPackageDescriptions(packageNames)

      // Add descriptions to dependencies
      const depsWithDescriptions = allDeps.map((dep) => ({
        ...dep,
        description: descriptions[dep.name] || "No description available",
      }))

      return NextResponse.json(
        {
          error: "An unexpected error occurred, using package.json as fallback",
          details: error instanceof Error ? error.message : String(error),
          dependencies: depsWithDescriptions,
          fallback: true,
        },
        { status: 500 },
      )
    } catch (fallbackError) {
      return NextResponse.json(
        {
          error: "Failed to fetch dependencies",
          details: error instanceof Error ? error.message : String(error),
          fallbackError: fallbackError instanceof Error ? fallbackError.message : String(fallbackError),
        },
        { status: 500 },
      )
    }
  }
}

export async function POST(request: Request) {
  try {
    const supabase = createAdminClient()
    const body = await request.json()
    const { id, name, current_version, latest_version, locked, locked_version, update_mode } = body

    // Check if dependencies table exists
    const { data: tableExists, error: checkError } = await supabase.rpc("check_table_exists", {
      table_name: "dependencies",
    })

    if (checkError) {
      console.error("Error checking if dependencies table exists:", checkError)
      return NextResponse.json(
        {
          error: "Failed to check if dependencies table exists",
          details: checkError.message,
        },
        { status: 500 },
      )
    }

    // If table doesn't exist, return appropriate message
    if (!tableExists) {
      return NextResponse.json(
        {
          error: "Dependencies table does not exist",
          tablesMissing: true,
        },
        { status: 404 },
      )
    }

    // If id is provided, update existing dependency
    if (id) {
      const updateData: any = {}

      if (locked !== undefined) updateData.locked = locked
      if (locked_version !== undefined) updateData.locked_version = locked_version
      if (update_mode !== undefined) updateData.update_mode = update_mode
      if (latest_version !== undefined) updateData.latest_version = latest_version
      if (current_version !== undefined) updateData.current_version = current_version

      updateData.updated_at = new Date().toISOString()

      const { error: updateError } = await supabase.from("dependencies").update(updateData).eq("id", id)

      if (updateError) {
        console.error("Error updating dependency:", updateError)
        return NextResponse.json(
          {
            error: "Failed to update dependency",
            details: updateError.message,
          },
          { status: 500 },
        )
      }

      return NextResponse.json({ success: true, message: "Dependency updated successfully" })
    }

    // If name is provided, add new dependency
    if (name && current_version) {
      const { error: insertError } = await supabase.from("dependencies").insert({
        name,
        current_version,
        latest_version: latest_version || current_version,
        locked: locked || false,
        locked_version: locked_version,
        update_mode: update_mode || "global",
      })

      if (insertError) {
        console.error("Error adding dependency:", insertError)
        return NextResponse.json(
          {
            error: "Failed to add dependency",
            details: insertError.message,
          },
          { status: 500 },
        )
      }

      return NextResponse.json({ success: true, message: "Dependency added successfully" })
    }

    return NextResponse.json(
      {
        error: "Invalid request. Missing required fields.",
      },
      { status: 400 },
    )
  } catch (error) {
    console.error("Error in dependencies API:", error)
    return NextResponse.json(
      {
        error: "An unexpected error occurred",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    )
  }
}
