import { NextResponse } from "next/server"
import { exec } from "child_process"
import { promisify } from "util"

const execAsync = promisify(exec)

export async function GET() {
  try {
    // Run npm ls --json to get a list of all dependencies
    const { stdout } = await execAsync("npm ls --json --depth=0")

    // Parse the JSON output
    const npmData = JSON.parse(stdout)

    // Extract dependencies and devDependencies
    const dependencies = npmData.dependencies || {}

    // Format the dependencies into a more usable structure
    const formattedDeps = Object.entries(dependencies).map(([name, details]: [string, any]) => ({
      name,
      current_version: details.version,
      latest_version: null, // We'll fetch this separately
      required_version: details.required?.version || "*",
      from: details.from || name,
      resolved: details.resolved || null,
      has_security_update: false, // We'll check this separately
      update_mode: "global", // Default
    }))

    return NextResponse.json({
      success: true,
      dependencies: formattedDeps,
      total: formattedDeps.length,
    })
  } catch (error) {
    console.error("Error listing dependencies:", error)
    return NextResponse.json(
      {
        error: "Failed to list dependencies",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    )
  }
}
