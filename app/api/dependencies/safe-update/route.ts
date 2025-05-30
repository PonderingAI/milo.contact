import { NextResponse } from "next/server"
import { exec } from "child_process"
import { promisify } from "util"
import fs from "fs"
import path from "path"

const execAsync = promisify(exec)

// Helper to run a command and capture output
async function runCommand(command: string, options = {}) {
  try {
    const { stdout, stderr } = await execAsync(command, { timeout: 60000, ...options })
    return { success: true, stdout, stderr }
  } catch (error) {
    return {
      success: false,
      stdout: error.stdout || "",
      stderr: error.stderr || String(error),
      error,
    }
  }
}

// Create a backup of package.json
async function createBackup() {
  const packageJsonPath = path.join(process.cwd(), "package.json")
  const backupPath = path.join(process.cwd(), "package.json.backup")

  try {
    fs.copyFileSync(packageJsonPath, backupPath)
    return { success: true, path: backupPath }
  } catch (error) {
    console.error("Failed to create backup:", error)
    return { success: false, error: String(error) }
  }
}

// Restore from backup
async function restoreFromBackup() {
  const packageJsonPath = path.join(process.cwd(), "package.json")
  const backupPath = path.join(process.cwd(), "package.json.backup")

  try {
    if (fs.existsSync(backupPath)) {
      fs.copyFileSync(backupPath, packageJsonPath)
      return { success: true }
    }
    return { success: false, error: "Backup file not found" }
  } catch (error) {
    console.error("Failed to restore backup:", error)
    return { success: false, error: String(error) }
  }
}

// Check if the application still works after updates
async function verifyApplication() {
  // First, try to build the application
  const buildResult = await runCommand("npm run build --if-present")

  if (!buildResult.success) {
    return {
      success: false,
      stage: "build",
      error: "Build failed after dependency updates",
      details: buildResult.stderr,
    }
  }

  // Then, run tests if they exist
  const testResult = await runCommand("npm test -- --passWithNoTests")

  if (!testResult.success) {
    return {
      success: false,
      stage: "test",
      error: "Tests failed after dependency updates",
      details: testResult.stderr,
    }
  }

  return { success: true }
}

export async function POST(request: Request) {
  try {
    const { packages: packageInputs, mode = "compatible", dryRun = false } = await request.json()

    if (
      !packageInputs ||
      !Array.isArray(packageInputs) ||
      packageInputs.length === 0 ||
      !packageInputs.every((p) => typeof p === "object" && p !== null && typeof p.name === "string" && p.name.length > 0)
    ) {
      return NextResponse.json(
        {
          error:
            "Invalid 'packages' input. Expected an array of objects, each with a 'name' property. Optional 'version' property.",
        },
        { status: 400 },
      )
    }
    
    // Extract package names for modes that operate on all packages uniformly
    const packageNames = packageInputs.map(p => p.name);


    // Create a backup before making any changes
    const backup = await createBackup()
    if (!backup.success) {
      return NextResponse.json({ error: "Failed to create backup before updating" }, { status: 500 })
    }

    // Log the update operation
    console.log(`Starting ${dryRun ? "dry run " : ""}update of ${packageInputs.length} packages in ${mode} mode`)

    let updateCommand
    let updateResult

    // Different update strategies based on mode
    switch (mode) {
      case "specific":
        if (packageInputs.some(p => typeof p.name !== 'string' || p.name.trim() === '')) {
          return NextResponse.json({ error: "Invalid package format for 'specific' mode. All packages must have a 'name'." }, { status: 400 });
        }
        const specificPackagesCmd = packageInputs
          .map((pkg) => {
            if (pkg.version && typeof pkg.version === 'string' && pkg.version.trim() !== '') {
              return `${pkg.name}@${pkg.version.trim()}`
            }
            return `${pkg.name}@latest` // Default to latest if no version specified
          })
          .join(" ")
        updateCommand = `npm install ${specificPackagesCmd}`
        break
      case "compatible":
        // Update to highest version that satisfies existing constraints
        updateCommand = `npm update ${packageNames.join(" ")}`
        break

      case "latest":
        // Update to latest version, ignoring existing constraints
        updateCommand = `npm install ${packageNames.map((pkgName) => `${pkgName}@latest`).join(" ")}`
        break

      case "minor":
        // Use npm-check-updates to update to latest minor version
        updateCommand = `npx npm-check-updates -u --target minor ${packageNames.map((pkgName) => `-f ${pkgName}`).join(" ")}`
        updateResult = await runCommand(updateCommand)

        if (updateResult.success) {
          // npm-check-updates only updates package.json, we need to install the packages
          updateResult = await runCommand("npm install")
        }
        break

      case "patch":
        // Use npm-check-updates to update to latest patch version
        updateCommand = `npx npm-check-updates -u --target patch ${packageNames.map((pkgName) => `-f ${pkgName}`).join(" ")}`
        updateResult = await runCommand(updateCommand)

        if (updateResult.success) {
          // npm-check-updates only updates package.json, we need to install the packages
          updateResult = await runCommand("npm install")
        }
        break

      default:
        return NextResponse.json({ error: `Unknown update mode: ${mode}` }, { status: 400 })
    }

    // If we haven't run the command yet (for non-ncu modes and specific mode)
    if (!updateResult) {
      updateResult = await runCommand(updateCommand)
    }

    if (!updateResult.success) {
      // Restore from backup if the update failed
      await restoreFromBackup()

      return NextResponse.json(
        {
          success: false,
          error: "Failed to update dependencies",
          command: updateCommand,
          details: updateResult.stderr,
        },
        { status: 500 },
      )
    }

    // If this is a dry run, restore from backup
    if (dryRun) {
      await restoreFromBackup()
      return NextResponse.json({
        success: true,
        dryRun: true,
        message: "Dry run completed successfully",
        command: updateCommand,
        output: updateResult.stdout,
      })
    }

    // Verify that the application still works after the updates
    const verificationResult = await verifyApplication()

    if (!verificationResult.success) {
      // Restore from backup if verification failed
      await restoreFromBackup()

      return NextResponse.json(
        {
          success: false,
          error: "Verification failed after dependency updates",
          stage: verificationResult.stage,
          details: verificationResult.details,
        },
        { status: 500 },
      )
    }

    // Get the updated versions
    const updatedVersions = {}
    try {
      const packageJsonPath = path.join(process.cwd(), "package.json")
      const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf8"))

      packageInputs.forEach((pkg) => {
        const pkgName = pkg.name
        if (packageJson.dependencies && packageJson.dependencies[pkgName]) {
          updatedVersions[pkgName] = packageJson.dependencies[pkgName]
        } else if (packageJson.devDependencies && packageJson.devDependencies[pkgName]) {
          updatedVersions[pkgName] = packageJson.devDependencies[pkgName]
        }
      })
    } catch (error) {
      console.error("Error reading updated versions:", error)
      // Not a fatal error for the update itself, but log it
    }

    return NextResponse.json({
      success: true,
      message: "Dependencies updated successfully",
      command: updateCommand,
      updatedVersions,
    })
  } catch (error) {
    console.error("Error in safe-update API:", error)

    // Try to restore from backup if something went wrong
    await restoreFromBackup()

    return NextResponse.json(
      {
        success: false,
        error: "An unexpected error occurred",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    )
  }
}
