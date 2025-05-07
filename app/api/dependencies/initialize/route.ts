import { NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase-server"
import { getDependenciesFromPackageJson, getPackageDescriptions } from "@/lib/dependency-utils"

let initialized = false

export async function GET() {
  try {
    if (initialized) {
      return NextResponse.json({
        success: true,
        message: "Dependency management system already initialized",
      })
    }

    // Try to set up the dependency tables
    try {
      const setupResponse = await fetch("http://localhost:3000/api/dependencies/setup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      })

      if (!setupResponse.ok) {
        console.error("Error setting up dependency tables:", await setupResponse.text())
      }
    } catch (setupError) {
      console.error("Error setting up dependency tables:", setupError)
    }

    // Seed the database with package.json dependencies
    try {
      const supabase = createAdminClient()

      // Check if tables exist
      const { data: tablesExist, error: checkError } = await supabase.rpc("check_dependency_tables_exist")

      if (checkError || !tablesExist) {
        console.error("Dependency tables don't exist yet, skipping initialization")
        return NextResponse.json({
          success: false,
          message: "Dependency tables don't exist yet, please set them up first",
        })
      }

      // Get dependencies from package.json
      const { dependencies, devDependencies } = await getDependenciesFromPackageJson()
      const allDeps = [...dependencies, ...devDependencies]

      // Get package descriptions
      const packageNames = allDeps.map((dep) => dep.name)
      const descriptions = await getPackageDescriptions(packageNames)

      // Insert dependencies into database
      for (const dep of allDeps) {
        const { error: insertError } = await supabase.from("dependencies").upsert(
          {
            name: dep.name,
            current_version: dep.current_version,
            latest_version: dep.current_version,
            is_dev: dep.is_dev,
            description: descriptions[dep.name] || "No description available",
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
          { onConflict: "name" },
        )

        if (insertError) {
          console.error(`Error inserting dependency ${dep.name}:`, insertError)
        }
      }
    } catch (seedError) {
      console.error("Error seeding dependency database:", seedError)
    }

    initialized = true

    return NextResponse.json({
      success: true,
      message: "Dependency management system initialized",
    })
  } catch (error) {
    console.error("Error initializing dependency management system:", error)
    return NextResponse.json(
      {
        error: "Failed to initialize dependency management system",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    )
  }
}
