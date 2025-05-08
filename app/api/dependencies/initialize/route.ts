import { NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase-server"
import fs from "fs"
import path from "path"

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

    // Read package.json
    let packageJson
    try {
      const packageJsonPath = path.join(process.cwd(), "package.json")
      const packageJsonContent = fs.readFileSync(packageJsonPath, "utf8")
      packageJson = JSON.parse(packageJsonContent)
    } catch (readError) {
      console.error("Error reading package.json:", readError)
      return NextResponse.json(
        {
          success: false,
          error: "Error reading package.json",
          details: readError instanceof Error ? readError.message : String(readError),
        },
        { status: 500 },
      )
    }

    // Extract dependencies
    const dependencies = Object.entries(packageJson.dependencies || {}).map(([name, version]) => ({
      name,
      current_version: String(version).replace(/[^0-9.]/g, ""),
      is_dev: false,
    }))

    const devDependencies = Object.entries(packageJson.devDependencies || {}).map(([name, version]) => ({
      name,
      current_version: String(version).replace(/[^0-9.]/g, ""),
      is_dev: true,
    }))

    const allDeps = [...dependencies, ...devDependencies]

    if (allDeps.length === 0) {
      return NextResponse.json({
        success: false,
        error: "No dependencies found in package.json",
      })
    }

    // Check if dependencies already exist in the database
    const { data: existingDeps, error: fetchError } = await supabase.from("dependencies").select("name")

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

    if (newDeps.length === 0 && existingDepNames.length > 0) {
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
      is_dev: dep.is_dev,
      description: `${dep.name} package`,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }))

    if (depsToInsert.length > 0) {
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
    }

    return NextResponse.json({
      success: true,
      message: "Dependencies initialized successfully",
      added: depsToInsert.length,
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

export async function GET() {
  return POST()
}
