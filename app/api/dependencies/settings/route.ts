import { NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase-server"

export async function GET(request: Request) {
  try {
    const supabase = createAdminClient()

    // Get the current settings
    const { data, error } = await supabase
      .from("dependency_settings")
      .select("*")
      .order("id", { ascending: false })
      .limit(1)
      .single()

    if (error) {
      // If no settings exist, create default settings
      if (error.code === "PGRST116") {
        const { data: newData, error: insertError } = await supabase
          .from("dependency_settings")
          .insert({
            update_mode: "aggressive", // Default to aggressive
            auto_update_enabled: true, // Enable auto-updates by default
            update_schedule: "daily",
          })
          .select()
          .single()

        if (insertError) {
          return NextResponse.json(
            {
              error: "Failed to create default settings",
              details: insertError.message,
            },
            { status: 500 },
          )
        }

        return NextResponse.json({
          success: true,
          data: newData,
        })
      }

      return NextResponse.json(
        {
          error: "Failed to fetch settings",
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
    console.error("Error in settings GET API:", error)
    return NextResponse.json(
      {
        error: "An unexpected error occurred",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    )
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { updateMode, autoUpdateEnabled, updateSchedule } = body

    // Validate update mode
    const validModes = ["off", "conservative", "aggressive"]
    if (updateMode && !validModes.includes(updateMode)) {
      return NextResponse.json(
        {
          error: "Invalid update mode",
          details: `Update mode must be one of: ${validModes.join(", ")}`,
        },
        { status: 400 },
      )
    }

    const supabase = createAdminClient()

    // Check if settings exist
    const { data: existingData, error: existingError } = await supabase
      .from("dependency_settings")
      .select("id")
      .order("id", { ascending: false })
      .limit(1)
      .maybeSingle()

    if (existingError && existingError.code !== "PGRST116") {
      return NextResponse.json(
        {
          error: "Failed to check for existing settings",
          details: existingError.message,
        },
        { status: 500 },
      )
    }

    const updateData = {}
    if (updateMode !== undefined) updateData["update_mode"] = updateMode
    if (autoUpdateEnabled !== undefined) updateData["auto_update_enabled"] = autoUpdateEnabled
    if (updateSchedule !== undefined) updateData["update_schedule"] = updateSchedule

    let result
    if (existingData) {
      // Update existing settings
      const { data, error } = await supabase
        .from("dependency_settings")
        .update({
          ...updateData,
          updated_at: new Date().toISOString(),
        })
        .eq("id", existingData.id)
        .select()

      result = { data, error, isNew: false }
    } else {
      // Create new settings with defaults for any missing fields
      const { data, error } = await supabase
        .from("dependency_settings")
        .insert({
          update_mode: updateMode || "aggressive", // Default to aggressive
          auto_update_enabled: autoUpdateEnabled !== undefined ? autoUpdateEnabled : true,
          update_schedule: updateSchedule || "daily",
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .select()

      result = { data, error, isNew: true }
    }

    if (result.error) {
      return NextResponse.json(
        {
          error: "Failed to save settings",
          details: result.error.message,
        },
        { status: 500 },
      )
    }

    return NextResponse.json({
      success: true,
      data: result.data[0],
      message: result.isNew ? "Settings created" : "Settings updated",
    })
  } catch (error) {
    console.error("Error in settings POST API:", error)
    return NextResponse.json(
      {
        error: "An unexpected error occurred",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    )
  }
}
