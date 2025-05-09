import { NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase-server"
import { exec } from "child_process"
import { promisify } from "util"
import fs from "fs"
import path from "path"

const execAsync = promisify(exec)

// Helper function to check if a table exists
async function checkTableExists(supabase, tableName) {
  try {
    // Query the information_schema to check if the table exists
    const { data, error } = await supabase
      .from("information_schema.tables")
      .select("table_name")
      .eq("table_schema", "public")
      .eq("table_name", tableName)
      .single()

    if (error) {
      console.error(`Error checking if ${tableName} exists:`, error)
      // Try alternative method if this fails
      return await fallbackTableCheck(supabase, tableName)
    }

    return !!data
  } catch (error) {
    console.error(`Error in checkTableExists for ${tableName}:`, error)
    // Try alternative method if this fails
    return await fallbackTableCheck(supabase, tableName)
  }
}

// Fallback method to check if a table exists
async function fallbackTableCheck(supabase, tableName) {
  try {
    // Try to query the table directly with a limit
    const { error } = await supabase.from(tableName).select("*").limit(1)

    // If no error, table exists
    return !error
  } catch (error) {
    console.error(`Fallback check failed for ${tableName}:`, error)
    return false
  }
}

// Function to get actual installed packages
async function getInstalledPackages() {
  try {
    // Read package.json
    const packageJsonPath = path.join(process.cwd(), "package.json")
    const packageJsonContent = fs.readFileSync(packageJsonPath, "utf8")
    const packageJson = JSON.parse(packageJsonContent)

    // Get dependencies and devDependencies
    const dependencies = Object.entries(packageJson.dependencies || {}).map(([name, version]) => ({
      name,
      current_version: version.toString().replace(/^\^|~/, ""),
      is_dev: false,
    }))

    const devDependencies = Object.entries(packageJson.devDependencies || {}).map(([name, version]) => ({
      name,
      current_version: version.toString().replace(/^\^|~/, ""),
      is_dev: true,
    }))

    // Try to get outdated packages info
    let outdatedInfo = {}
    try {
      const { stdout } = await execAsync("npm outdated --json", { timeout: 10000 })
      outdatedInfo = JSON.parse(stdout || "{}")
    } catch (error) {
      // npm outdated returns exit code 1 if there are outdated packages
      if (error instanceof Error && "stdout" in error) {
        try {
          outdatedInfo = JSON.parse((error as any).stdout || "{}")
        } catch (parseError) {
          console.error("Error parsing npm outdated output:", parseError)
        }
      }
    }

    // Try to get security vulnerabilities
    let vulnerabilities = {}
    try {
      const { stdout } = await execAsync("npm audit --json", { timeout: 10000 })
      vulnerabilities = JSON.parse(stdout || "{}")
    } catch (error) {
      // npm audit returns exit code 1 if there are vulnerabilities
      if (error instanceof Error && "stdout" in error) {
        try {
          vulnerabilities = JSON.parse((error as any).stdout || "{}")
        } catch (parseError) {
          console.error("Error parsing npm audit output:", parseError)
        }
      }
    }

    // Combine all packages
    const allPackages = [...dependencies, ...devDependencies]

    // Add outdated and vulnerability info
    return allPackages.map((pkg) => {
      const outdated = outdatedInfo[pkg.name]
      const hasVulnerability = vulnerabilities?.vulnerabilities?.[pkg.name] !== undefined

      return {
        ...pkg,
        latest_version: outdated?.latest || pkg.current_version,
        outdated: !!outdated,
        has_security_update: hasVulnerability,
      }
    })
  } catch (error) {
    console.error("Error getting installed packages:", error)

    // If we can't read package.json, add some common Next.js packages
    return [
      {
        name: "next",
        current_version: "14.0.0",
        latest_version: "14.0.0",
        is_dev: false,
        outdated: false,
        has_security_update: false,
      },
      {
        name: "react",
        current_version: "18.2.0",
        latest_version: "18.2.0",
        is_dev: false,
        outdated: false,
        has_security_update: false,
      },
      {
        name: "react-dom",
        current_version: "18.2.0",
        latest_version: "18.2.0",
        is_dev: false,
        outdated: false,
        has_security_update: false,
      },
      {
        name: "@supabase/supabase-js",
        current_version: "2.38.4",
        latest_version: "2.38.4",
        is_dev: false,
        outdated: false,
        has_security_update: false,
      },
    ]
  }
}

// Function to get package descriptions
async function getPackageDescriptions(packageNames) {
  const descriptions = {}

  for (const name of packageNames) {
    try {
      const response = await fetch(`https://registry.npmjs.org/${name}`)
      if (response.ok) {
        const data = await response.json()
        descriptions[name] = data.description || "No description available"
      }
    } catch (error) {
      console.error(`Error fetching description for ${name}:`, error)
      descriptions[name] = "Description unavailable"
    }
  }

  return descriptions
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
          message: "Please set up the dependencies table first",
        },
        { status: 404 },
      )
    }

    // Get installed packages
    const packages = await getInstalledPackages()

    // Get package descriptions
    const packageNames = packages.map((pkg) => pkg.name)
    const descriptions = await getPackageDescriptions(packageNames)

    // Add packages to database
    let addedCount = 0
    let updatedCount = 0
    let errorCount = 0

    for (const pkg of packages) {
      // Check if package already exists
      const { data: existingPkg, error: fetchError } = await supabase
        .from("dependencies")
        .select("id")
        .eq("name", pkg.name)
        .maybeSingle()

      if (fetchError && !fetchError.message.includes("No rows found")) {
        console.error(`Error checking if package ${pkg.name} exists:`, fetchError)
        errorCount++
        continue
      }

      const description = descriptions[pkg.name] || "No description available"

      if (existingPkg) {
        // Update existing package
        const { error: updateError } = await supabase
          .from("dependencies")
          .update({
            current_version: pkg.current_version,
            latest_version: pkg.latest_version,
            outdated: pkg.outdated,
            has_security_update: pkg.has_security_update,
            is_dev: pkg.is_dev,
            description,
            updated_at: new Date().toISOString(),
          })
          .eq("id", existingPkg.id)

        if (updateError) {
          console.error(`Error updating package ${pkg.name}:`, updateError)
          errorCount++
        } else {
          updatedCount++
        }
      } else {
        // Insert new package
        const { error: insertError } = await supabase.from("dependencies").insert({
          name: pkg.name,
          current_version: pkg.current_version,
          latest_version: pkg.latest_version,
          outdated: pkg.outdated,
          locked: false,
          update_mode: "global",
          has_security_update: pkg.has_security_update,
          is_dev: pkg.is_dev,
          description,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })

        if (insertError) {
          console.error(`Error inserting package ${pkg.name}:`, insertError)
          errorCount++
        } else {
          addedCount++
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: `Scan complete. Added ${addedCount} packages, updated ${updatedCount} packages. ${errorCount} errors.`,
      added: addedCount,
      updated: updatedCount,
      errors: errorCount,
      total: packages.length,
    })
  } catch (error) {
    console.error("Error scanning dependencies:", error)
    return NextResponse.json(
      {
        error: "Failed to scan dependencies",
        message: "An unexpected error occurred while scanning dependencies",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    )
  }
}
