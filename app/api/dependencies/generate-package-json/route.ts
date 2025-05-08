import { NextResponse } from "next/server"
import { exec } from "child_process"
import { promisify } from "util"
import fs from "fs"
import path from "path"

const execAsync = promisify(exec)

export async function GET() {
  try {
    // Get installed dependencies using npm list
    const { stdout: listOutput } = await execAsync("npm list --json --depth=0", { timeout: 30000 })
    const npmList = JSON.parse(listOutput)

    // Read current package.json if it exists
    let currentPackageJson = {}
    try {
      const packageJsonPath = path.join(process.cwd(), "package.json")
      const packageJsonContent = fs.readFileSync(packageJsonPath, "utf8")
      currentPackageJson = JSON.parse(packageJsonContent)
    } catch (error) {
      console.error("Error reading current package.json:", error)
    }

    // Create a new package.json structure
    const newPackageJson = {
      name: currentPackageJson.name || "milo-presedo-portfolio",
      version: currentPackageJson.version || "1.0.0",
      description: currentPackageJson.description || "Milo Presedo Portfolio Website",
      private: true,
      scripts: currentPackageJson.scripts || {
        dev: "next dev",
        build: "next build",
        start: "next start",
        lint: "next lint",
      },
      dependencies: {},
      devDependencies: {},
    }

    // Add dependencies from npm list
    if (npmList.dependencies) {
      Object.entries(npmList.dependencies).forEach(([name, info]) => {
        newPackageJson.dependencies[name] = (info as any).version
      })
    }

    // Try to detect dev dependencies
    try {
      const { stdout: devOutput } = await execAsync("npm list --dev --json --depth=0", { timeout: 30000 })
      const devList = JSON.parse(devOutput)

      if (devList.dependencies) {
        Object.entries(devList.dependencies).forEach(([name, info]) => {
          // Move from dependencies to devDependencies if it's a dev dependency
          if (newPackageJson.dependencies[name]) {
            newPackageJson.devDependencies[name] = newPackageJson.dependencies[name]
            delete newPackageJson.dependencies[name]
          } else {
            newPackageJson.devDependencies[name] = (info as any).version
          }
        })
      }
    } catch (devError) {
      console.error("Error detecting dev dependencies:", devError)
    }

    // Add common Next.js dev dependencies if they're not already included
    const commonDevDeps = {
      typescript: "^5.0.4",
      eslint: "^8.38.0",
      "@types/react": "^18.0.28",
      "@types/node": "^18.15.11",
      autoprefixer: "^10.4.14",
      postcss: "^8.4.21",
      tailwindcss: "^3.3.0",
    }

    Object.entries(commonDevDeps).forEach(([name, version]) => {
      if (!newPackageJson.dependencies[name] && !newPackageJson.devDependencies[name]) {
        newPackageJson.devDependencies[name] = version
      }
    })

    // Write the new package.json file
    const packageJsonPath = path.join(process.cwd(), "package.json.generated")
    fs.writeFileSync(packageJsonPath, JSON.stringify(newPackageJson, null, 2))

    return NextResponse.json({
      success: true,
      message: "Generated package.json.generated file",
      packageJson: newPackageJson,
    })
  } catch (error) {
    console.error("Error generating package.json:", error)
    return NextResponse.json(
      {
        error: "Failed to generate package.json",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    )
  }
}
