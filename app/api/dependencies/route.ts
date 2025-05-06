import { NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase-server"

export async function GET() {
  try {
    const supabase = createAdminClient()

    // Check if dependencies table exists
    const { data: depsTableExists, error: checkDepsError } = await supabase.rpc("check_table_exists", {
      table_name: "dependencies",
    })

    if (checkDepsError) {
      console.error("Error checking if dependencies table exists:", checkDepsError)
      return NextResponse.json(
        {
          error: "Failed to check if dependencies table exists",
          details: checkDepsError.message,
        },
        { status: 500 },
      )
    }

    // If dependencies table doesn't exist, return appropriate message
    if (!depsTableExists) {
      return NextResponse.json(
        {
          error: "Dependencies table does not exist",
          tablesMissing: true,
          dependencies: [],
        },
        { status: 404 },
      )
    }

    // Check if dependency_settings table exists
    const { data: settingsTableExists, error: checkSettingsError } = await supabase.rpc("check_table_exists", {
      table_name: "dependency_settings",
    })

    if (checkSettingsError) {
      console.error("Error checking if dependency_settings table exists:", checkSettingsError)
    }

    // Get settings if table exists
    let settings = { update_mode: "conservative" }
    if (settingsTableExists) {
      const { data: settingsData, error: settingsError } = await supabase
        .from("dependency_settings")
        .select("*")
        .limit(1)
        .single()

      if (!settingsError) {
        settings = settingsData
      }
    }

    // Get existing dependencies from database
    const { data: dependencies, error: depsError } = await supabase.from("dependencies").select("*")

    if (depsError) {
      console.error("Error fetching existing dependencies:", depsError)
      return NextResponse.json(
        {
          error: "Failed to fetch dependencies",
          details: depsError.message,
        },
        { status: 500 },
      )
    }

    // Calculate security stats
    const vulnerabilities = dependencies.filter((d) => d.has_security_update).length
    const outdatedPackages = dependencies.filter(
      (d) => d.current_version !== d.latest_version && d.latest_version,
    ).length

    // Calculate security score
    let securityScore = 100

    // Deduct for vulnerabilities
    securityScore -= vulnerabilities * 10

    // Deduct less for outdated packages
    securityScore -= Math.min(10, outdatedPackages * 2)

    // Ensure score is between 0 and 100
    securityScore = Math.max(0, Math.min(100, securityScore))

    return NextResponse.json({
      dependencies,
      updateMode: settings.update_mode,
      securityScore,
      vulnerabilities,
      outdatedPackages,
    })
  } catch (error) {
    console.error("Error in dependencies API:", error)
    return NextResponse.json(
      {
        error: "Failed to fetch dependencies",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    )
  }
}

export async function POST(request: Request) {
  try {
    const supabase = createAdminClient()
    const body = await request.json()
    const { id, name, current_version, latest_version, locked, locked_version, update_mode } = body

    // Check if dependencies table exists
    const { data: tableExists, error: checkError } = await supabase.rpc("check_table_exists", {
      table_name: "dependencies",
    })

    if (checkError) {
      console.error("Error checking if dependencies table exists:", checkError)
      return NextResponse.json(
        {
          error: "Failed to check if dependencies table exists",
          details: checkError.message,
        },
        { status: 500 },
      )
    }

    // If table doesn't exist, return appropriate message
    if (!tableExists) {
      return NextResponse.json(
        {
          error: "Dependencies table does not exist",
          tablesMissing: true,
        },
        { status: 404 },
      )
    }

    // If id is provided, update existing dependency
    if (id) {
      const updateData: any = {}

      if (locked !== undefined) updateData.locked = locked
      if (locked_version !== undefined) updateData.locked_version = locked_version
      if (update_mode !== undefined) updateData.update_mode = update_mode
      if (latest_version !== undefined) updateData.latest_version = latest_version
      if (current_version !== undefined) updateData.current_version = current_version

      updateData.updated_at = new Date().toISOString()

      const { error: updateError } = await supabase.from("dependencies").update(updateData).eq("id", id)

      if (updateError) {
        console.error("Error updating dependency:", updateError)
        return NextResponse.json(
          {
            error: "Failed to update dependency",
            details: updateError.message,
          },
          { status: 500 },
        )
      }

      return NextResponse.json({ success: true, message: "Dependency updated successfully" })
    }

    // If name is provided, add new dependency
    if (name && current_version) {
      const { error: insertError } = await supabase.from("dependencies").insert({
        name,
        current_version,
        latest_version: latest_version || current_version,
        locked: locked || false,
        locked_version: locked_version,
        update_mode: update_mode || "global",
      })

      if (insertError) {
        console.error("Error adding dependency:", insertError)
        return NextResponse.json(
          {
            error: "Failed to add dependency",
            details: insertError.message,
          },
          { status: 500 },
        )
      }

      return NextResponse.json({ success: true, message: "Dependency added successfully" })
    }

    return NextResponse.json(
      {
        error: "Invalid request. Missing required fields.",
      },
      { status: 400 },
    )
  } catch (error) {
    console.error("Error in dependencies API:", error)
    return NextResponse.json(
      {
        error: "An unexpected error occurred",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    )
  }
}
