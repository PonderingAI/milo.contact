import { createClient } from "@/lib/supabase-server"
import { type NextRequest, NextResponse } from "next/server"
import { exec } from "child_process"
import { promisify } from "util"
import fs from "fs"
import path from "path"

const execAsync = promisify(exec)

// Helper function to update a dependency
async function updateDependency(name: string, version: string | null) {
  try {
    const command = version ? `npm install ${name}@${version} --save-exact` : `npm install ${name}@latest`

    const { stdout, stderr } = await execAsync(command)
    return { success: true, stdout, stderr }
  } catch (error) {
    console.error(`Error updating ${name}:`, error)
    throw new Error(`Failed to update ${name}: ${error instanceof Error ? error.message : String(error)}`)
  }
}

// Helper function to get package.json
async function getPackageJson() {
  const packageJsonPath = path.join(process.cwd(), "package.json")
  try {
    const packageJsonContent = await fs.promises.readFile(packageJsonPath, "utf8")
    return JSON.parse(packageJsonContent)
  } catch (error) {
    console.error("Error reading package.json:", error)
    throw new Error("Failed to read package.json")
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient()
    const body = await request.json()

    const { id, toVersion } = body

    if (!id) {
      return NextResponse.json({ error: "Dependency ID is required" }, { status: 400 })
    }

    // Get dependency info
    const { data: dependency, error: fetchError } = await supabase
      .from("dependencies")
      .select("*")
      .eq("id", id)
      .single()

    if (fetchError || !dependency) {
      return NextResponse.json(
        {
          error: fetchError?.message || "Dependency not found",
        },
        { status: fetchError ? 500 : 404 },
      )
    }

    // Update the dependency
    try {
      const version = toVersion || dependency.latest_version
      const result = await updateDependency(dependency.name, version)

      // Get the new version from package.json
      const packageJson = await getPackageJson()
      const allDependencies = {
        ...(packageJson.dependencies || {}),
        ...(packageJson.devDependencies || {}),
      }

      const newVersion = allDependencies[dependency.name]?.replace(/[\^~]/g, "")

      // Update the database
      const { error: updateError } = await supabase
        .from("dependencies")
        .update({
          current_version: newVersion,
          last_updated: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq("id", id)

      if (updateError) {
        return NextResponse.json({ error: updateError.message }, { status: 500 })
      }

      return NextResponse.json({
        success: true,
        message: `Successfully updated ${dependency.name} to ${newVersion}`,
        details: result,
      })
    } catch (error) {
      return NextResponse.json(
        {
          error: "Failed to update dependency",
          details: error instanceof Error ? error.message : String(error),
        },
        { status: 500 },
      )
    }
  } catch (error) {
    console.error("Error in update dependency:", error)
    return NextResponse.json(
      {
        error: "An unexpected error occurred",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    )
  }
}
