import { NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase-server"
import { getDependenciesFromPackageJson, getPackageDescriptions } from "@/lib/dependency-utils"

export async function POST() {
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
          success: false,
          error: "Error checking if dependencies table exists",
          details: tableCheckError.message,
        },
        { status: 500 },
      )
    }

    if (!tableExists) {
      return NextResponse.json(
        {
          success: false,
          error: "Dependencies table does not exist",
        },
        { status: 404 },
      )
    }

    // Get dependencies from package.json
    const { dependencies, devDependencies } = await getDependenciesFromPackageJson()
    const allDeps = [...dependencies, ...devDependencies]

    if (allDeps.length === 0) {
      return NextResponse.json({
        success: false,
        error: "No dependencies found in package.json",
      })
    }

    // Get package descriptions
    const packageNames = allDeps.map((dep) => dep.name)
    const descriptions = await getPackageDescriptions(packageNames)

    // Check if dependencies already exist in the database
    const { data: existingDeps, error: fetchError } = await supabase
      .from("dependencies")
      .select("name")
      .in("name", packageNames)

    if (fetchError) {
      console.error("Error fetching existing dependencies:", fetchError)
      return NextResponse.json(
        {
          success: false,
          error: "Error fetching existing dependencies",
          details: fetchError.message,
        },
        { status: 500 },
      )
    }

    const existingDepNames = existingDeps?.map((dep) => dep.name) || []
    const newDeps = allDeps.filter((dep) => !existingDepNames.includes(dep.name))

    if (newDeps.length === 0) {
      return NextResponse.json({
        success: true,
        message: "All dependencies already exist in the database",
        added: 0,
      })
    }

    // Insert new dependencies
    const depsToInsert = newDeps.map((dep) => ({
      name: dep.name,
      current_version: dep.current_version,
      latest_version: dep.current_version, // Will be updated later by check-updates
      description: descriptions[dep.name] || "",
      is_dev: dep.is_dev,
    }))

    const { error: insertError } = await supabase.from("dependencies").insert(depsToInsert)

    if (insertError) {
      console.error("Error inserting dependencies:", insertError)
      return NextResponse.json(
        {
          success: false,
          error: "Error inserting dependencies",
          details: insertError.message,
        },
        { status: 500 },
      )
    }

    return NextResponse.json({
      success: true,
      message: "Dependencies initialized successfully",
      added: newDeps.length,
    })
  } catch (error) {
    console.error("Error initializing dependencies:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Error initializing dependencies",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    )
  }
}
