import { NextResponse } from "next/server"
import { promises as fs } from "fs"
import path from "path"
import { exec } from "child_process"
import { promisify } from "util"

// Promisify exec
const execAsync = promisify(exec)

// Read package.json and parse dependencies
async function getDependencies() {
  try {
    const packageJsonPath = path.join(process.cwd(), "package.json")
    const packageJsonContent = await fs.readFile(packageJsonPath, "utf-8")
    const packageJson = JSON.parse(packageJsonContent)

    // Extract dependencies and dev dependencies
    const dependencies = Object.entries(packageJson.dependencies || {}).map(([name, version]) => ({
      name,
      currentVersion: String(version).replace(/^\^|~/, ""),
      type: "production",
    }))

    const devDependencies = Object.entries(packageJson.devDependencies || {}).map(([name, version]) => ({
      name,
      currentVersion: String(version).replace(/^\^|~/, ""),
      type: "development",
    }))

    return [...dependencies, ...devDependencies]
  } catch (error) {
    console.error("Error reading package.json:", error)
    throw new Error("Failed to read package.json")
  }
}

// Check for latest versions using npm outdated
async function checkLatestVersions(dependencies) {
  const updatedDeps = [...dependencies]

  try {
    // Run npm outdated in JSON format
    const { stdout } = await execAsync("npm outdated --json")

    if (stdout.trim()) {
      const outdated = JSON.parse(stdout)

      // Update each dependency with latest version info
      for (const dep of updatedDeps) {
        if (outdated[dep.name]) {
          dep.latestVersion = outdated[dep.name].latest
          dep.needsUpdate = true
        } else {
          dep.latestVersion = dep.currentVersion
          dep.needsUpdate = false
        }
      }
    }
  } catch (error) {
    // npm outdated returns non-zero exit code when updates are available
    if (error instanceof Error && "stdout" in error && error.stdout) {
      try {
        const outdated = JSON.parse(error.stdout as string)

        // Update each dependency with latest version info
        for (const dep of updatedDeps) {
          if (outdated[dep.name]) {
            dep.latestVersion = outdated[dep.name].latest
            dep.needsUpdate = true
          } else {
            dep.latestVersion = dep.currentVersion
            dep.needsUpdate = false
          }
        }
      } catch (parseError) {
        console.error("Error parsing npm outdated output:", parseError)
      }
    } else {
      console.error("Error checking for updates:", error)
    }
  }

  return updatedDeps
}

// Preferences file path
const PREFS_FILE_PATH = path.join(process.cwd(), ".dependency-prefs.json")

// Save preferences to file
async function savePreferences(prefs) {
  try {
    await fs.writeFile(PREFS_FILE_PATH, JSON.stringify(prefs, null, 2))
    return true
  } catch (error) {
    console.error("Error saving preferences:", error)
    return false
  }
}

// Load preferences from file
async function loadPreferences() {
  try {
    const content = await fs.readFile(PREFS_FILE_PATH, "utf-8")
    return JSON.parse(content)
  } catch (error) {
    // Return default preferences if file doesn't exist
    return {
      globalMode: "manual",
      packages: {},
    }
  }
}

export async function GET() {
  try {
    // Get dependencies from package.json
    const dependencies = await getDependencies()

    // Check for latest versions
    const dependenciesWithVersions = await checkLatestVersions(dependencies)

    // Load preferences
    const preferences = await loadPreferences()

    // Combine preferences with dependencies
    const result = dependenciesWithVersions.map((dep) => {
      const packagePrefs = preferences.packages[dep.name] || {}

      return {
        ...dep,
        updateMode: packagePrefs.updateMode || "global",
        locked: packagePrefs.locked || false,
        lockedVersion: packagePrefs.lockedVersion || dep.currentVersion,
      }
    })

    return NextResponse.json({
      dependencies: result,
      globalMode: preferences.globalMode || "manual",
    })
  } catch (error) {
    console.error("Error fetching dependencies:", error)
    return NextResponse.json(
      { error: "Failed to fetch dependencies", details: error instanceof Error ? error.message : String(error) },
      { status: 500 },
    )
  }
}

export async function POST(request: Request) {
  try {
    const { packageName, updateMode, locked, lockedVersion, globalMode } = await request.json()

    // Load current preferences
    const preferences = await loadPreferences()

    // Update global mode if provided
    if (globalMode) {
      preferences.globalMode = globalMode
    }

    // Update package-specific preferences if provided
    if (packageName) {
      if (!preferences.packages[packageName]) {
        preferences.packages[packageName] = {}
      }

      if (updateMode !== undefined) {
        preferences.packages[packageName].updateMode = updateMode
      }

      if (locked !== undefined) {
        preferences.packages[packageName].locked = locked
      }

      if (lockedVersion) {
        preferences.packages[packageName].lockedVersion = lockedVersion
      }
    }

    // Save updated preferences
    await savePreferences(preferences)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error updating preferences:", error)
    return NextResponse.json(
      { error: "Failed to update preferences", details: error instanceof Error ? error.message : String(error) },
      { status: 500 },
    )
  }
}
