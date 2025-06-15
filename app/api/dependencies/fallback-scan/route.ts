import { NextResponse } from "next/server"
import { getRouteHandlerSupabaseClient, checkAdminPermission } from "@/lib/auth-server"
import { auth } from "@clerk/nextjs/server"
import fs from "fs"
import path from "path"

export async function POST() {
  try {
    // Check if user is authenticated
    const { userId } = auth()
    if (!userId) {
      return NextResponse.json({ 
        error: "Unauthorized", 
        message: "You must be signed in to perform this action",
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
        message: "Admin role required",
        debug_userIdFromAuth: userId,
        supabaseError: "No admin role found in Clerk metadata",
        supabaseCode: "PERMISSION_DENIED"
      }, { status: 403 })
    }

    // Check if dependencies table exists
    try {
      const { data: tableExists, error: tableError } = await supabase.rpc("check_table_exists", {
        table_name: "dependencies",
      })

      if (tableError) {
        return NextResponse.json(
          {
            error: "Error checking if table exists",
            message: tableError.message,
            debug_userIdFromAuth: userId
          },
          { status: 500 },
        )
      }

      if (!tableExists) {
        return NextResponse.json(
          {
            error: "Dependencies table does not exist",
            message: "Please set up the dependencies table first",
            debug_userIdFromAuth: userId
          },
          { status: 404 },
        )
      }
    } catch (tableCheckError) {
      return NextResponse.json(
        {
          error: "Error checking if table exists",
          message: tableCheckError instanceof Error ? tableCheckError.message : String(tableCheckError),
          debug_userIdFromAuth: userId
        },
        { status: 500 },
      )
    }

    // Read package.json directly
    let packageJson
    try {
      const packageJsonPath = path.join(process.cwd(), "package.json")
      const packageJsonContent = fs.readFileSync(packageJsonPath, "utf8")
      packageJson = JSON.parse(packageJsonContent)
    } catch (err) {
      return NextResponse.json(
        {
          error: "Error reading package.json",
          message: err instanceof Error ? err.message : String(err),
          debug_userIdFromAuth: userId
        },
        { status: 500 },
      )
    }

    // Extract dependencies
    const dependencies = Object.entries(packageJson.dependencies || {}).map(([name, version]) => ({
      name,
      current_version: String(version).replace(/^\^|~/, ""),
      latest_version: String(version).replace(/^\^|~/, ""),
      is_dev: false,
      has_security_update: false,
      description: "",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }))

    const devDependencies = Object.entries(packageJson.devDependencies || {}).map(([name, version]) => ({
      name,
      current_version: String(version).replace(/^\^|~/, ""),
      latest_version: String(version).replace(/^\^|~/, ""),
      is_dev: true,
      has_security_update: false,
      description: "",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }))

    const allDependencies = [...dependencies, ...devDependencies]

    // Add packages to database
    let addedCount = 0
    let updatedCount = 0
    let errorCount = 0

    for (const pkg of allDependencies) {
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

      if (existingPkg) {
        // Update existing package
        const { error: updateError } = await supabase
          .from("dependencies")
          .update({
            current_version: pkg.current_version,
            latest_version: pkg.latest_version,
            is_dev: pkg.is_dev,
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
          outdated: false,
          locked: false,
          update_mode: "global",
          has_security_update: false,
          is_dev: pkg.is_dev,
          description: "",
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
      message: `Fallback scan complete. Added ${addedCount} packages, updated ${updatedCount} packages. ${errorCount} errors.`,
      added: addedCount,
      updated: updatedCount,
      errors: errorCount,
      total: allDependencies.length,
      debug_userIdFromAuth: userId
    })
  } catch (error) {
    console.error("Error in fallback scan:", error)
    const { userId } = auth()
    
    return NextResponse.json(
      {
        error: "Failed to scan dependencies",
        message: "An unexpected error occurred while scanning dependencies",
        details: error instanceof Error ? error.message : String(error),
        stack: process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.stack : undefined) : undefined,
        debug_userIdFromAuth: userId
      },
      { status: 500 },
    )
  }
}
