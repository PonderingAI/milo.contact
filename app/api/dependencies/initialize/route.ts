import { NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase-server"
import fs from "fs"
import path from "path"

export async function POST() {
  try {
    const supabase = createAdminClient()

    // Read package.json
    const packageJsonPath = path.join(process.cwd(), "package.json")
    const packageJsonContent = fs.readFileSync(packageJsonPath, "utf8")
    const packageJson = JSON.parse(packageJsonContent)

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

    // Insert dependencies (using upsert to avoid duplicates)
    for (const dep of allDeps) {
      const { error } = await supabase.from("dependencies").upsert(
        {
          name: dep.name,
          current_version: dep.current_version,
          latest_version: dep.current_version,
          is_dev: dep.is_dev,
          description: `${dep.name} package`,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        { onConflict: "name" },
      )

      if (error) {
        console.error(`Error upserting dependency ${dep.name}:`, error)
      }
    }

    return NextResponse.json({
      success: true,
      message: "Dependencies initialized successfully",
      count: allDeps.length,
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
