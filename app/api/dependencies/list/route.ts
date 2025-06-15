import { NextResponse } from "next/server"
import { getRouteHandlerSupabaseClient, checkAdminPermission } from "@/lib/auth-server"
import { auth } from "@clerk/nextjs/server"

export async function GET() {
  try {
    // Check if user is authenticated
    const { userId } = auth()
    if (!userId) {
      return NextResponse.json({ 
        error: "Unauthorized", 
        message: "You must be signed in to view dependencies",
        debug_userIdFromAuth: null 
      }, { status: 401 })
    }
    
    // Get authenticated Supabase client
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

    // Get dependencies from database
    const { data, error } = await supabase
      .from("dependencies")
      .select("*")
      .order("name", { ascending: true })

    if (error) {
      return NextResponse.json(
        {
          error: "Failed to fetch dependencies",
          message: error.message,
          debug_userIdFromAuth: userId
        },
        { status: 500 },
      )
    }

    // Get dependency settings
    const { data: settings, error: settingsError } = await supabase
      .from("dependency_settings")
      .select("*")
      .limit(1)
      .single()

    if (settingsError && !settingsError.message.includes("No rows found")) {
      console.warn("Error fetching dependency settings:", settingsError)
    }

    return NextResponse.json({
      dependencies: data || [],
      settings: settings || { update_mode: "conservative", auto_update_enabled: false },
      count: data ? data.length : 0,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error("Error in list dependencies API:", error)
    const { userId } = auth()
    
    return NextResponse.json(
      {
        error: "Failed to list dependencies",
        message: "An unexpected error occurred while listing dependencies",
        details: error instanceof Error ? error.message : String(error),
        stack: process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.stack : undefined) : undefined,
        debug_userIdFromAuth: userId
      },
      { status: 500 },
    )
  }
}
