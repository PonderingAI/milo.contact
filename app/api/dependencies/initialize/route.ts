import { NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase-server"
import fs from "fs"
import path from "path"
import { exec } from "child_process"
import util from "util"

const execPromise = util.promisify(exec)

export async function GET() {
  return POST()
}

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

    // Try to get outdated packages
    let outdatedInfo = {}
    try {
      // Run npm outdated --json
      const { stdout } = await execPromise("npm outdated --json", { timeout: 30000 })
      outdatedInfo = JSON.parse(stdout)
    } catch (error) {
      // npm outdated returns non-zero exit code if there are outdated packages
      if (error.stdout) {
        try {
          outdatedInfo = JSON.parse(error.stdout)
        } catch (parseError) {
          console.error("Error parsing npm outdated output:", parseError)
        }
      } else {
        console.error("Error running npm outdated:", error)
      }
    }

    // Insert dependencies
    for (const dep of allDeps) {
      const outdatedData = outdatedInfo[dep.name]
      const latestVersion = outdatedData?.latest || dep.current_version

      try {
        await supabase.from("dependencies").upsert(
          {
            name: dep.name,
            current_version: dep.current_version,
            latest_version: latestVersion,
            is_dev: dep.is_dev,
            description: `${dep.name} package`,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
          { onConflict: "name" },
        )
      } catch (insertError) {
        console.error(`Error upserting dependency ${dep.name}:`, insertError)
        // Continue with other dependencies
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
