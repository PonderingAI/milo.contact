import { NextResponse } from "next/server"
import { getRouteHandlerSupabaseClient, checkAdminPermission } from "@/lib/auth-server"
import { auth } from "@clerk/nextjs/server"
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

// Check if package exists in npm registry
async function checkPackageExists(packageName: string): Promise<boolean> {
  try {
    const response = await fetch(`https://registry.npmjs.org/${packageName}`, {
      method: 'HEAD',
      headers: {
        'Accept': 'application/json',
      },
    })
    return response.ok
  } catch (error) {
    console.error(`Error checking if package ${packageName} exists:`, error)
    return false
  }
}

// Get package info from npm registry
async function getPackageInfo(packageName: string) {
  try {
    const response = await fetch(`https://registry.npmjs.org/${packageName}`, {
      headers: {
        'Accept': 'application/json',
      },
    })

    if (!response.ok) {
      throw new Error(`Failed to fetch package info: ${response.status}`)
    }

    const data = await response.json()

    // Extract the latest version
    const latestVersion = data["dist-tags"]?.latest || ""

    // Get description and repository info
    const description = data.description || ""
    const repository =
      typeof data.repository === "object"
        ? data.repository.url
        : typeof data.repository === "string"
          ? data.repository
          : ""

    // Clean up repository URL
    let repoUrl = ""
    if (repository) {
      repoUrl = repository
        .replace(/^git\+/, "")
        .replace(/\.git$/, "")
        .replace(/^git:\/\//, "https://")
        .replace(/^ssh:\/\/git@/, "https://")
    }

    return {
      latestVersion,
      description,
      repository: repoUrl,
      homepage: data.homepage || "",
      license: data.license || "Unknown",
      author: data.author ? (typeof data.author === "object" ? data.author.name : data.author) : "Unknown",
    }
  } catch (error) {
    console.error(`Error fetching info for ${packageName}:`, error)
    return {
      latestVersion: "",
      description: "",
      repository: "",
      homepage: "",
      license: "Unknown",
      author: "Unknown",
    }
  }
}

// Add package to package.json
async function addToPackageJson(packageName: string, version: string, isDev: boolean = false): Promise<boolean> {
  try {
    const packageJsonPath = path.join(process.cwd(), "package.json")
    const packageJsonContent = fs.readFileSync(packageJsonPath, "utf8")
    const packageJson = JSON.parse(packageJsonContent)

    // Determine which dependencies object to use
    const depsKey = isDev ? "devDependencies" : "dependencies"
    
    // Initialize if doesn't exist
    if (!packageJson[depsKey]) {
      packageJson[depsKey] = {}
    }

    // Add or update the package
    packageJson[depsKey][packageName] = version

    // Write the updated package.json
    fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2))
    return true
  } catch (error) {
    console.error(`Error adding ${packageName} to package.json:`, error)
    return false
  }
}

export async function POST(request: Request) {
  try {
    // Check if user is authenticated
    const { userId } = auth()
    if (!userId) {
      return NextResponse.json({ 
        error: "Unauthorized", 
        message: "You must be signed in to add packages",
        debug_userIdFromAuth: null 
      }, { status: 401 })
    }
    
    // Get authenticated Supabase client that syncs Clerk with Supabase
    const supabase = await getRouteHandlerSupabaseClient()
    
    // Check if user has admin role via Clerk metadata
    const hasAdminPermission = await checkAdminPermission(userId)
    
    if (!hasAdminPermission) {
      return NextResponse.json({ 
        error: "Permission denied", 
        message: "Admin role required to add packages",
        debug_userIdFromAuth: userId,
        supabaseError: "No admin role found in Clerk metadata",
        supabaseCode: "PERMISSION_DENIED"
      }, { status: 403 })
    }

    // Parse request body
    const { packageName, version, isDev = false } = await request.json()

    // Validate input
    if (!packageName || typeof packageName !== "string" || packageName.trim() === "") {
      return NextResponse.json(
        {
          error: "Invalid package name",
          message: "Package name is required and must be a non-empty string",
          debug_userIdFromAuth: userId
        },
        { status: 400 }
      )
    }

    // Sanitize package name
    const sanitizedPackageName = packageName.trim()

    // Check if package exists in npm registry
    const packageExists = await checkPackageExists(sanitizedPackageName)
    if (!packageExists) {
      return NextResponse.json(
        {
          error: "Package not found",
          message: `Package '${sanitizedPackageName}' not found in npm registry`,
          debug_userIdFromAuth: userId
        },
        { status: 404 }
      )
    }

    // Get package info from npm registry
    const packageInfo = await getPackageInfo(sanitizedPackageName)
    
    // Determine version to use
    const versionToUse = version && typeof version === "string" && version.trim() !== "" 
      ? version.trim() 
      : packageInfo.latestVersion || "latest"

    // Add package to package.json
    const addedToPackageJson = await addToPackageJson(sanitizedPackageName, versionToUse, isDev)
    if (!addedToPackageJson) {
      return NextResponse.json(
        {
          error: "Failed to update package.json",
          message: "Could not add package to package.json file",
          debug_userIdFromAuth: userId
        },
        { status: 500 }
      )
    }

    // Install the package
    const installCommand = `npm install ${isDev ? '--save-dev' : '--save'} ${sanitizedPackageName}@${versionToUse}`
    const installResult = await runCommand(installCommand)

    if (!installResult.success) {
      return NextResponse.json(
        {
          error: "Failed to install package",
          message: `Error installing ${sanitizedPackageName}@${versionToUse}`,
          command: installCommand,
          details: installResult.stderr,
          debug_userIdFromAuth: userId
        },
        { status: 500 }
      )
    }

    // Check if dependencies table exists
    try {
      const { data: tableExists, error: tableError } = await supabase.rpc("check_table_exists", {
        table_name: "dependencies",
      })

      if (tableError) {
        console.warn("Error checking if dependencies table exists:", tableError)
        // Continue anyway - we'll try to add to the table and handle any errors
      } else if (!tableExists) {
        console.warn("Dependencies table does not exist - package installed but not tracked in database")
        // Continue anyway - the package is installed even if we can't track it
      }
    } catch (tableCheckError) {
      console.warn("Error checking if dependencies table exists:", tableCheckError)
      // Continue anyway - we'll try to add to the table and handle any errors
    }

    // Add package to dependencies table
    try {
      const { error: insertError } = await supabase.from("dependencies").insert({
        name: sanitizedPackageName,
        current_version: versionToUse.replace(/^(\^|~)/, ""),
        latest_version: packageInfo.latestVersion || versionToUse.replace(/^(\^|~)/, ""),
        outdated: false,
        locked: false,
        update_mode: "global",
        has_security_update: false,
        is_dev: isDev,
        description: packageInfo.description,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })

      if (insertError) {
        console.warn(`Error adding ${sanitizedPackageName} to dependencies table:`, insertError)
        // Continue anyway - the package is installed even if we can't track it
      }
    } catch (dbError) {
      console.warn(`Error adding ${sanitizedPackageName} to dependencies table:`, dbError)
      // Continue anyway - the package is installed even if we can't track it
    }

    // Return success response
    return NextResponse.json({
      success: true,
      message: `Successfully added ${sanitizedPackageName}@${versionToUse}`,
      package: {
        name: sanitizedPackageName,
        version: versionToUse,
        description: packageInfo.description,
        isDev,
      },
      installOutput: installResult.stdout,
    })
  } catch (error) {
    console.error("Error in add-package API:", error)
    const { userId } = auth()
    
    return NextResponse.json(
      {
        error: "Failed to add package",
        message: "An unexpected error occurred while adding the package",
        details: error instanceof Error ? error.message : String(error),
        stack: process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.stack : undefined) : undefined,
        debug_userIdFromAuth: userId
      },
      { status: 500 }
    )
  }
}
