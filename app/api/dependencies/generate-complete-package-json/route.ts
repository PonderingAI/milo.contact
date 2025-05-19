import { NextResponse } from "next/server"
import fs from "fs"
import path from "path"
import { exec } from "child_process"
import { promisify } from "util"

const execAsync = promisify(exec)

export async function GET() {
  try {
    // Read the current package.json
    const packageJsonPath = path.join(process.cwd(), "package.json")
    const packageJsonContent = fs.readFileSync(packageJsonPath, "utf8")
    const currentPackageJson = JSON.parse(packageJsonContent)

    // Get all dependencies from npm list
    const dependencies = {}
    const devDependencies = {}

    try {
      // Get production dependencies
      const { stdout: prodOutput } = await execAsync("npm list --prod --depth=0 --json", { timeout: 30000 })
      const prodData = JSON.parse(prodOutput)

      if (prodData.dependencies) {
        Object.entries(prodData.dependencies).forEach(([name, info]) => {
          dependencies[name] = (info as any).version
        })
      }

      // Get dev dependencies
      const { stdout: devOutput } = await execAsync("npm list --dev --depth=0 --json", { timeout: 30000 })
      const devData = JSON.parse(devOutput)

      if (devData.dependencies) {
        Object.entries(devData.dependencies).forEach(([name, info]) => {
          devDependencies[name] = (info as any).version
        })
      }
    } catch (error) {
      console.error("Error getting dependencies from npm list:", error)

      // Fallback to using npm ls
      try {
        const { stdout } = await execAsync("npm ls --all --json", { timeout: 30000 })
        const data = JSON.parse(stdout)

        if (data.dependencies) {
          Object.entries(data.dependencies).forEach(([name, info]) => {
            // Determine if it's a dev dependency based on the current package.json
            if (currentPackageJson.devDependencies && name in currentPackageJson.devDependencies) {
              devDependencies[name] = (info as any).version
            } else {
              dependencies[name] = (info as any).version
            }
          })
        }
      } catch (fallbackError) {
        console.error("Error with fallback dependency detection:", fallbackError)
      }
    }

    // Create a new package.json with all dependencies
    const completePackageJson = {
      ...currentPackageJson,
      dependencies: {
        ...dependencies,
        ...currentPackageJson.dependencies,
      },
      devDependencies: {
        ...devDependencies,
        ...currentPackageJson.devDependencies,
      },
    }

    // Write to a new file to avoid overwriting the current package.json
    const outputPath = path.join(process.cwd(), "package.json.complete")
    fs.writeFileSync(outputPath, JSON.stringify(completePackageJson, null, 2))

    return NextResponse.json({
      success: true,
      message: "Complete package.json generated successfully",
      path: outputPath,
      packageJson: completePackageJson,
    })
  } catch (error) {
    console.error("Error generating complete package.json:", error)
    return NextResponse.json(
      {
        error: "Failed to generate complete package.json",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    )
  }
}
