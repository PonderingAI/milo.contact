import { NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase-server"
import fs from "fs"
import path from "path"
import { exec } from "child_process"
import { promisify } from "util"

const execAsync = promisify(exec)

// Helper function to check if a table exists
async function checkTableExists(supabase, tableName) {
  try {
    const { data, error } = await supabase
      .from("information_schema.tables")
      .select("table_name")
      .eq("table_schema", "public")
      .eq("table_name", tableName)
      .single()

    if (error) {
      console.error(`Error checking if ${tableName} exists:`, error)
      return false
    }

    return !!data
  } catch (error) {
    console.error(`Error in checkTableExists for ${tableName}:`, error)
    return false
  }
}

// Helper function to get dependencies from package.json
async function getDependenciesFromPackageJson() {
  try {
    // Try to read package.json directly from the file system
    const packageJsonPath = path.join(process.cwd(), "package.json")
    const packageJsonContent = fs.readFileSync(packageJsonPath, "utf8")
    const packageJson = JSON.parse(packageJsonContent)

    return {
      dependencies: Object.entries(packageJson.dependencies || {}).map(([name, version]) => ({
        name,
        current_version: version.toString().replace(/^\^|~/, ""),
        is_dev: false,
      })),
      devDependencies: Object.entries(packageJson.devDependencies || {}).map(([name, version]) => ({
        name,
        current_version: version.toString().replace(/^\^|~/, ""),
        is_dev: true,
      })),
    }
  } catch (error) {
    console.error("Error reading package.json:", error)
    return { dependencies: [], devDependencies: [] }
  }
}

export async function POST() {
  try {
    const supabase = createAdminClient()

    // Check if dependencies table exists
    const tableExists = await checkTableExists(supabase, "dependencies")

    if (!tableExists) {
      return NextResponse.json(
        {
          error: "Dependencies table does not exist",
          message: "The dependencies table has not been set up. Please set up the table first.",
          tableExists: false,
        },
        { status: 404 },
      )
    }

    // Get dependencies from package.json
    const { dependencies, devDependencies } = await getDependenciesFromPackageJson()
    const allDeps = [...dependencies, ...devDependencies]

    if (allDeps.length === 0) {
      return NextResponse.json(
        {
          error: "No dependencies found",
          message: "No dependencies found in package.json.",
          dependencies: [],
        },
        { status: 404 },
      )
    }

    // Try to get outdated packages using npm
    let outdatedPackages = {}
    try {
      const { stdout } = await execAsync("npm outdated --json")
      if (stdout) {
        outdatedPackages = JSON.parse(stdout)
      }
    } catch (error) {
      // npm outdated returns exit code 1 if there are outdated packages
      if (error.stdout) {
        try {
          outdatedPackages = JSON.parse(error.stdout)
        } catch (parseError) {
          console.error("Error parsing npm outdated output:", parseError)
        }
      } else {
        console.error("Error running npm outdated:", error)
      }
    }

    // Try to get security vulnerabilities using npm audit
    let securityIssues = {}
    try {
      const { stdout } = await execAsync("npm audit --json")
      if (stdout) {
        securityIssues = JSON.parse(stdout)
      }
    } catch (error) {
      // npm audit returns exit code 1 if there are vulnerabilities
      if (error.stdout) {
        try {
          securityIssues = JSON.parse(error.stdout)
        } catch (parseError) {
          console.error("Error parsing npm audit output:", parseError)
        }
      } else {
        console.error("Error running npm audit:", error)
      }
    }

    // Clear existing dependencies
    const { error: clearError } = await supabase.from("dependencies").delete().neq("id", 0)

    if (clearError) {
      console.error("Error clearing dependencies:", clearError)
      return NextResponse.json(
        {
          error: "Failed to clear existing dependencies",
          message: "There was an error clearing existing dependencies.",
          details: clearError.message,
        },
        { status: 500 },
      )
    }

    // Insert dependencies
    const depsToInsert = allDeps.map((dep) => {
      const outdatedInfo = outdatedPackages[dep.name]
      const hasSecurityIssue = securityIssues?.vulnerabilities?.[dep.name] !== undefined

      return {
        name: dep.name,
        current_version: dep.current_version,
        latest_version: outdatedInfo?.latest || dep.current_version,
        outdated: !!outdatedInfo,
        locked: false,
        has_security_issue: hasSecurityIssue,
        security_details: hasSecurityIssue ? securityIssues?.vulnerabilities?.[dep.name] : null,
        update_mode: "global",
        is_dev: dep.is_dev,
        description: "",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }
    })

    const { error: insertError } = await supabase.from("dependencies").insert(depsToInsert)

    if (insertError) {
      console.error("Error inserting dependencies:", insertError)
      return NextResponse.json(
        {
          error: "Failed to insert dependencies",
          message: "There was an error inserting dependencies into the database.",
          details: insertError.message,
        },
        { status: 500 },
      )
    }

    return NextResponse.json({
      message: "Dependencies scanned and updated successfully.",
      dependenciesCount: depsToInsert.length,
      outdatedCount: Object.keys(outdatedPackages).length,
      vulnerabilitiesCount: Object.keys(securityIssues?.vulnerabilities || {}).length,
    })
  } catch (error) {
    console.error("Error in scan API:", error)
    return NextResponse.json(
      {
        error: "An unexpected error occurred",
        message: "There was an unexpected error scanning dependencies.",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    )
  }
}
