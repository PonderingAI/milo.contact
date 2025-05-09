import { NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase-server"

// Helper function to check if a table exists without using RPC
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

export async function GET() {
  try {
    const supabase = createAdminClient()

    // Check if dependencies table exists without using RPC
    const depsTableExists = await checkTableExists(supabase, "dependencies")

    // If dependencies table doesn't exist, return early
    if (!depsTableExists) {
      return NextResponse.json(
        {
          error: "Dependencies table does not exist",
          message: "The dependencies table has not been set up. Please set up the table first.",
        },
        { status: 404 },
      )
    }

    // Check if dependency_settings table exists without using RPC
    const settingsTableExists = await checkTableExists(supabase, "dependency_settings")

    // Get the global update mode (default to conservative if table doesn't exist)
    let globalMode = "conservative"

    if (settingsTableExists) {
      const { data: settings, error: settingsError } = await supabase
        .from("dependency_settings")
        .select("*")
        .limit(1)
        .single()

      if (!settingsError && settings) {
        globalMode = settings?.update_mode || "conservative"
      }
    }

    // Get dependencies that should be auto-updated based on their update mode
    const { data: dependencies, error: fetchError } = await supabase
      .from("dependencies")
      .select("*")
      .or(`update_mode.eq.auto,and(update_mode.eq.conservative,has_security_update.eq.true)`)
      .eq("locked", false)

    if (fetchError) {
      console.error("Error fetching dependencies:", fetchError)
      return NextResponse.json(
        {
          error: "Failed to fetch dependencies",
          message: "There was an error retrieving dependencies from the database.",
          details: fetchError.message,
        },
        { status: 500 },
      )
    }

    if (!dependencies || dependencies.length === 0) {
      return NextResponse.json({
        message: "No dependencies to auto-update",
        empty: true,
      })
    }

    // Update each dependency in the database
    const results = []

    for (const dep of dependencies) {
      try {
        // In a real implementation, this would actually update the dependency
        // For now, we'll just update the database record

        const { error: updateError } = await supabase
          .from("dependencies")
          .update({
            current_version: dep.latest_version,
            last_updated: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            has_security_update: false,
          })
          .eq("id", dep.id)

        if (updateError) {
          console.error(`Error updating dependency ${dep.name}:`, updateError)
          results.push({
            name: dep.name,
            success: false,
            error: updateError.message,
          })
        } else {
          results.push({
            name: dep.name,
            success: true,
            from: dep.current_version,
            to: dep.latest_version,
          })
        }
      } catch (error) {
        console.error(`Error processing dependency ${dep.name}:`, error)
        results.push({
          name: dep.name,
          success: false,
          error: error instanceof Error ? error.message : String(error),
        })
      }
    }

    return NextResponse.json({
      success: true,
      updated: results.filter((r) => r.success).length,
      failed: results.filter((r) => !r.success).length,
      results,
    })
  } catch (error) {
    console.error("Error in scheduled update:", error)
    return NextResponse.json(
      {
        error: "An unexpected error occurred",
        message: "There was an unexpected error processing your request.",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    )
  }
}
