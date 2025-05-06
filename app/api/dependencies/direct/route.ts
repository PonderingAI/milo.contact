import { NextResponse } from "next/server"
import { exec } from "child_process"
import { promises as fs } from "fs"
import path from "path"

// Function to execute shell commands asynchronously
function execPromise(command: string): Promise<string> {
  return new Promise((resolve, reject) => {
    exec(command, { maxBuffer: 1024 * 1024 * 10 }, (error, stdout, stderr) => {
      if (error) {
        reject(error)
        return
      }
      resolve(stdout.trim())
    })
  })
}

// Function to read package.json
async function readPackageJson() {
  try {
    const packageJsonPath = path.join(process.cwd(), "package.json")
    const packageJsonContent = await fs.readFile(packageJsonPath, "utf-8")
    return JSON.parse(packageJsonContent)
  } catch (error) {
    console.error("Error reading package.json:", error)
    throw new Error("Failed to read package.json")
  }
}

// Function to get installed dependencies
async function getInstalledDependencies() {
  try {
    // Read dependencies directly from package.json
    const packageJson = await readPackageJson()

    const dependencies = Object.entries(packageJson.dependencies || {}).map(([name, version]) => ({
      name,
      currentVersion: String(version).replace(/^\^|~/, ""),
      isDev: false,
    }))

    const devDependencies = Object.entries(packageJson.devDependencies || {}).map(([name, version]) => ({
      name,
      currentVersion: String(version).replace(/^\^|~/, ""),
      isDev: true,
    }))

    return [...dependencies, ...devDependencies]
  } catch (error) {
    console.error("Error getting installed dependencies:", error)
    throw error
  }
}

// Function to get update preferences from a JSON file
async function getUpdatePreferences() {
  try {
    const prefsPath = path.join(process.cwd(), "dependency-prefs.json")
    try {
      const prefsContent = await fs.readFile(prefsPath, "utf-8")
      return JSON.parse(prefsContent)
    } catch (error) {
      // If file doesn't exist, create it with default preferences
      const defaultPrefs = {
        globalMode: "global",
        dependencies: {},
      }
      await fs.writeFile(prefsPath, JSON.stringify(defaultPrefs, null, 2))
      return defaultPrefs
    }
  } catch (error) {
    console.error("Error getting update preferences:", error)
    return { globalMode: "global", dependencies: {} }
  }
}

// Function to save update preferences to a JSON file
async function saveUpdatePreferences(prefs: any) {
  try {
    const prefsPath = path.join(process.cwd(), "dependency-prefs.json")
    await fs.writeFile(prefsPath, JSON.stringify(prefs, null, 2))
    return true
  } catch (error) {
    console.error("Error saving update preferences:", error)
    return false
  }
}

export async function GET() {
  try {
    // Get installed dependencies
    const installedDeps = await getInstalledDependencies()
    const prefs = await getUpdatePreferences()

    // For each dependency, check if it has preferences
    const dependenciesWithPrefs = installedDeps.map((dep) => {
      const depPrefs = prefs.dependencies[dep.name] || {}
      return {
        ...dep,
        updateMode: depPrefs.updateMode || "global",
        locked: depPrefs.locked || false,
        lockedVersion: depPrefs.lockedVersion || null,
      }
    })

    return NextResponse.json({
      dependencies: dependenciesWithPrefs,
      globalMode: prefs.globalMode || "global",
    })
  } catch (error) {
    console.error("Error in direct dependencies API:", error)
    return NextResponse.json(
      { error: "Failed to get dependencies", details: error instanceof Error ? error.message : String(error) },
      { status: 500 },
    )
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { name, updateMode, locked, lockedVersion } = body

    if (!name) {
      return NextResponse.json({ error: "Package name is required" }, { status: 400 })
    }

    // Get current preferences
    const prefs = await getUpdatePreferences()

    // Update preferences for the specified package
    if (!prefs.dependencies[name]) {
      prefs.dependencies[name] = {}
    }

    if (updateMode) {
      prefs.dependencies[name].updateMode = updateMode
    }

    if (locked !== undefined) {
      prefs.dependencies[name].locked = locked
    }

    if (lockedVersion) {
      prefs.dependencies[name].lockedVersion = lockedVersion
    }

    // Save updated preferences
    await saveUpdatePreferences(prefs)

    return NextResponse.json({ success: true, message: "Preferences updated successfully" })
  } catch (error) {
    console.error("Error updating preferences:", error)
    return NextResponse.json(
      { error: "Failed to update preferences", details: error instanceof Error ? error.message : String(error) },
      { status: 500 },
    )
  }
}
