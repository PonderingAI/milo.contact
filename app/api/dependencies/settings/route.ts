import { NextResponse } from "next/server"
import { getRouteHandlerSupabaseClient, checkAdminPermission } from "@/lib/auth-server"
import { auth } from "@clerk/nextjs/server"

// GET handler to retrieve dependency settings
export async function GET() {
  try {
    // Check if user is authenticated
    const { userId } = auth()
    if (!userId) {
      return NextResponse.json({ 
        error: "Unauthorized", 
        message: "You must be signed in to view dependency settings",
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
        message: "Admin role required to view dependency settings",
        debug_userIdFromAuth: userId,
        supabaseError: "No admin role found in Clerk metadata",
        supabaseCode: "PERMISSION_DENIED"
      }, { status: 403 })
    }
    
    // Check if dependency_settings table exists
    try {
      const { data: tableExists, error: tableError } = await supabase.rpc("check_table_exists", {
        table_name: "dependency_settings",
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
            error: "Dependency settings table does not exist",
            message: "Please set up the dependency_settings table first",
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

    // Get settings from database
    const { data, error } = await supabase.from("dependency_settings").select("*").limit(1).single()

    if (error) {
      if (error.code === "PGRST116") {
        // No settings found, return default values
        return NextResponse.json({
          update_mode: "conservative",
          auto_update_enabled: false,
          update_schedule: "weekly",
        })
      }
      
      return NextResponse.json(
        {
          error: "Failed to fetch dependency settings",
          message: error.message,
          debug_userIdFromAuth: userId
        },
        { status: 500 },
      )
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error("Error in get settings API:", error)
    const { userId } = auth()
    
    return NextResponse.json(
      {
        error: "Failed to get dependency settings",
        message: "An unexpected error occurred while fetching dependency settings",
        details: error instanceof Error ? error.message : String(error),
        stack: process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.stack : undefined) : undefined,
        debug_userIdFromAuth: userId
      },
      { status: 500 },
    )
  }
}

// POST handler to update dependency settings
export async function POST(request: Request) {
  try {
    // Check if user is authenticated
    const { userId } = auth()
    if (!userId) {
      return NextResponse.json({ 
        error: "Unauthorized", 
        message: "You must be signed in to update dependency settings",
        debug_userIdFromAuth: null 
      }, { status: 401 })
    }
    
    // Get authenticated Supabase client that syncs Clerk with Supabase
    const supabase = await getRouteHandlerSupabaseClient()
    
    // Check if user has admin role
    const { data: roleData, error: roleError } = await supabase
      .from('user_roles')
      .select('*')
      .eq('user_id', userId)
      .eq('role', 'admin')
    
    if (roleError || !roleData || roleData.length === 0) {
      return NextResponse.json({ 
        error: "Permission denied", 
        message: "Admin role required to update dependency settings",
        debug_userIdFromAuth: userId,
        supabaseError: roleError?.message || "No admin role found",
        supabaseCode: roleError?.code || "PERMISSION_DENIED"
      }, { status: 403 })
    }

    // Parse request body
    const settings = await request.json()

    // Validate settings
    if (!settings) {
      return NextResponse.json(
        {
          error: "Invalid settings",
          message: "Settings object is required",
          debug_userIdFromAuth: userId
        },
        { status: 400 },
      )
    }

    // Validate update_mode
    if (settings.update_mode && !["off", "conservative", "aggressive"].includes(settings.update_mode)) {
      return NextResponse.json(
        {
          error: "Invalid update_mode",
          message: "update_mode must be one of: off, conservative, aggressive",
          debug_userIdFromAuth: userId
        },
        { status: 400 },
      )
    }

    // Validate auto_update_enabled
    if (settings.auto_update_enabled !== undefined && typeof settings.auto_update_enabled !== "boolean") {
      return NextResponse.json(
        {
          error: "Invalid auto_update_enabled",
          message: "auto_update_enabled must be a boolean",
          debug_userIdFromAuth: userId
        },
        { status: 400 },
      )
    }

    // Validate update_schedule
    if (
      settings.update_schedule &&
      !["daily", "weekly", "monthly", "never"].includes(settings.update_schedule)
    ) {
      return NextResponse.json(
        {
          error: "Invalid update_schedule",
          message: "update_schedule must be one of: daily, weekly, monthly, never",
          debug_userIdFromAuth: userId
        },
        { status: 400 },
      )
    }

    // Check if dependency_settings table exists
    try {
      const { data: tableExists, error: tableError } = await supabase.rpc("check_table_exists", {
        table_name: "dependency_settings",
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
            error: "Dependency settings table does not exist",
            message: "Please set up the dependency_settings table first",
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

    // Get current settings to check if any exist
    const { data: existingSettings, error: fetchError } = await supabase
      .from("dependency_settings")
      .select("id")
      .limit(1)

    if (fetchError && !fetchError.message.includes("No rows found")) {
      return NextResponse.json(
        {
          error: "Failed to fetch existing settings",
          message: fetchError.message,
          debug_userIdFromAuth: userId
        },
        { status: 500 },
      )
    }

    // Prepare update data
    const updateData = {
      ...settings,
      updated_at: new Date().toISOString(),
    }

    let result
    if (existingSettings && existingSettings.length > 0) {
      // Update existing settings
      result = await supabase.from("dependency_settings").update(updateData).eq("id", existingSettings[0].id)
    } else {
      // Insert new settings
      result = await supabase.from("dependency_settings").insert({
        ...updateData,
        created_at: new Date().toISOString(),
      })
    }

    if (result.error) {
      return NextResponse.json(
        {
          error: "Failed to update dependency settings",
          message: result.error.message,
          debug_userIdFromAuth: userId
        },
        { status: 500 },
      )
    }

    return NextResponse.json({
      success: true,
      message: "Dependency settings updated successfully",
      settings: updateData,
    })
  } catch (error) {
    console.error("Error in update settings API:", error)
    const { userId } = auth()
    
    return NextResponse.json(
      {
        error: "Failed to update dependency settings",
        message: "An unexpected error occurred while updating dependency settings",
        details: error instanceof Error ? error.message : String(error),
        stack: process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.stack : undefined) : undefined,
        debug_userIdFromAuth: userId
      },
      { status: 500 },
    )
  }
}
