import { createClient } from "@/lib/supabase-server"
import { type NextRequest, NextResponse } from "next/server"
import { exec } from "child_process"
import { promisify } from "util"
import fs from "fs"
import path from "path"

const execAsync = promisify(exec)

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

// Helper function to check for updates
async function checkForUpdates(packageName: string) {
  try {
    const { stdout } = await execAsync(`npm view ${packageName} version`)
    return stdout.trim()
  } catch (error) {
    console.error(`Error checking updates for ${packageName}:`, error)
    throw new Error(`Failed to check updates for ${packageName}`)
  }
}

// Helper function to check if an update is a security fix
async function isSecurityFix(packageName: string, currentVersion: string, latestVersion: string) {
  try {
    // This is a simplified check - in a real-world scenario, you might want to use
    // a more sophisticated approach or a security advisory database
    const currentMajorMinor = currentVersion.split(".").slice(0, 2).join(".")
    const latestMajorMinor = latestVersion.split(".").slice(0, 2).join(".")

    // If major or minor version changed, it's likely not just a security fix
    if (currentMajorMinor !== latestMajorMinor) {
      return false
    }

    // Check npm advisories (simplified)
    const { stdout } = await execAsync(`npm audit --json`)
    const auditData = JSON.parse(stdout)

    // Check if this package has vulnerabilities
    return (
      auditData.vulnerabilities &&
      auditData.vulnerabilities[packageName] &&
      auditData.vulnerabilities[packageName].length > 0
    )
  } catch (error) {
    console.error(`Error checking if security fix for ${packageName}:`, error)
    // Default to false if we can't determine
    return false
  }
}

// GET - Fetch all dependencies
export async function GET() {
  try {
    const supabase = createClient()

    // Get dependencies from database
    const { data: dbDependencies, error: dbError } = await supabase.from("dependencies").select("*").order("name")

    if (dbError) {
      return NextResponse.json({ error: dbError.message }, { status: 500 })
    }

    // Get dependencies from package.json
    const packageJson = await getPackageJson()
    const allDependencies = {
      ...(packageJson.dependencies || {}),
      ...(packageJson.devDependencies || {}),
    }

    // Create a map of existing dependencies
    const existingDeps = new Map()
    if (dbDependencies) {
      dbDependencies.forEach((dep) => existingDeps.set(dep.name, dep))
    }

    // Check for new dependencies and updates
    const dependenciesToUpdate = []
    const dependenciesToInsert = []

    for (const [name, version] of Object.entries(allDependencies)) {
      const cleanVersion = (version as string).replace(/[\^~]/g, "")

      if (existingDeps.has(name)) {
        // Existing dependency - check for updates
        const dep = existingDeps.get(name)

        // Only check for updates if not checked recently (e.g., in the last 24 hours)
        const lastChecked = new Date(dep.last_checked)
        const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000)

        if (lastChecked < oneDayAgo) {
          try {
            const latestVersion = await checkForUpdates(name)
            const hasSecurityUpdate = await isSecurityFix(name, cleanVersion, latestVersion)

            dependenciesToUpdate.push({
              id: dep.id,
              latest_version: latestVersion,
              has_security_update: hasSecurityUpdate,
              last_checked: new Date().toISOString(),
            })
          } catch (error) {
            console.error(`Error checking updates for ${name}:`, error)
          }
        }
      } else {
        // New dependency - add to database
        try {
          const latestVersion = await checkForUpdates(name)

          dependenciesToInsert.push({
            name,
            current_version: cleanVersion,
            latest_version: latestVersion,
            locked: false,
            update_mode: "manual",
            last_checked: new Date().toISOString(),
          })
        } catch (error) {
          console.error(`Error adding new dependency ${name}:`, error)

          // Add with unknown latest version
          dependenciesToInsert.push({
            name,
            current_version: cleanVersion,
            latest_version: null,
            locked: false,
            update_mode: "manual",
            last_checked: new Date().toISOString(),
          })
        }
      }
    }

    // Update existing dependencies
    if (dependenciesToUpdate.length > 0) {
      for (const dep of dependenciesToUpdate) {
        const { error } = await supabase.from("dependencies").update(dep).eq("id", dep.id)

        if (error) {
          console.error(`Error updating dependency ${dep.id}:`, error)
        }
      }
    }

    // Insert new dependencies
    if (dependenciesToInsert.length > 0) {
      const { error } = await supabase.from("dependencies").insert(dependenciesToInsert)

      if (error) {
        console.error("Error inserting new dependencies:", error)
      }
    }

    // Fetch updated dependencies
    const { data: updatedDependencies, error: fetchError } = await supabase
      .from("dependencies")
      .select("*")
      .order("name")

    if (fetchError) {
      return NextResponse.json({ error: fetchError.message }, { status: 500 })
    }

    return NextResponse.json({ dependencies: updatedDependencies })
  } catch (error) {
    console.error("Error in GET dependencies:", error)
    return NextResponse.json(
      {
        error: "An unexpected error occurred",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    )
  }
}

// POST - Update dependency settings
export async function POST(request: NextRequest) {
  try {
    const supabase = createClient()
    const body = await request.json()

    const { id, locked, locked_version, update_mode } = body

    if (!id) {
      return NextResponse.json({ error: "Dependency ID is required" }, { status: 400 })
    }

    const updateData: any = {
      updated_at: new Date().toISOString(),
    }

    if (locked !== undefined) {
      updateData.locked = locked
    }

    if (locked_version !== undefined) {
      updateData.locked_version = locked_version
    }

    if (update_mode !== undefined) {
      updateData.update_mode = update_mode
    }

    const { error } = await supabase.from("dependencies").update(updateData).eq("id", id)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error in POST dependencies:", error)
    return NextResponse.json(
      {
        error: "An unexpected error occurred",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    )
  }
}
