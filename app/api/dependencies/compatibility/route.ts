import { NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase-server"

// Get all compatibility records or filter by package name
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const packageName = searchParams.get("package")

    const supabase = createAdminClient()

    let query = supabase.from("dependency_compatibility").select("*").order("package_name")

    if (packageName) {
      query = query.eq("package_name", packageName)
    }

    const { data, error } = await query

    if (error) {
      console.error("Error fetching compatibility data:", error)
      return NextResponse.json(
        {
          error: "Failed to fetch compatibility data",
          details: error.message,
        },
        { status: 500 },
      )
    }

    return NextResponse.json({
      success: true,
      data,
    })
  } catch (error) {
    console.error("Error in compatibility GET API:", error)
    return NextResponse.json(
      {
        error: "An unexpected error occurred",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    )
  }
}

// Add or update compatibility record
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const {
      package_name,
      min_compatible_version,
      max_compatible_version,
      recommended_version,
      compatibility_notes,
      verified_by,
      test_results,
      breaking_versions,
    } = body

    if (!package_name) {
      return NextResponse.json({ error: "Package name is required" }, { status: 400 })
    }

    const supabase = createAdminClient()

    // Check if record already exists
    const { data: existingData, error: existingError } = await supabase
      .from("dependency_compatibility")
      .select("id")
      .eq("package_name", package_name)
      .maybeSingle()

    if (existingError) {
      console.error("Error checking for existing record:", existingError)
      return NextResponse.json(
        {
          error: "Failed to check for existing record",
          details: existingError.message,
        },
        { status: 500 },
      )
    }

    const now = new Date().toISOString()

    let result
    if (existingData) {
      // Update existing record
      const { data, error } = await supabase
        .from("dependency_compatibility")
        .update({
          min_compatible_version,
          max_compatible_version,
          recommended_version,
          compatibility_notes,
          last_verified_date: now,
          verified_by,
          test_results,
          breaking_versions,
          updated_at: now,
        })
        .eq("id", existingData.id)
        .select()

      result = { data, error, isNew: false }
    } else {
      // Insert new record
      const { data, error } = await supabase
        .from("dependency_compatibility")
        .insert({
          package_name,
          min_compatible_version,
          max_compatible_version,
          recommended_version,
          compatibility_notes,
          last_verified_date: now,
          verified_by,
          test_results,
          breaking_versions,
          created_at: now,
          updated_at: now,
        })
        .select()

      result = { data, error, isNew: true }
    }

    if (result.error) {
      console.error("Error saving compatibility data:", result.error)
      return NextResponse.json(
        {
          error: "Failed to save compatibility data",
          details: result.error.message,
        },
        { status: 500 },
      )
    }

    return NextResponse.json({
      success: true,
      data: result.data[0],
      message: result.isNew ? "Compatibility record created" : "Compatibility record updated",
    })
  } catch (error) {
    console.error("Error in compatibility POST API:", error)
    return NextResponse.json(
      {
        error: "An unexpected error occurred",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    )
  }
}
