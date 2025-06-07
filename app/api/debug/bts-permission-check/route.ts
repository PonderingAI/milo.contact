import { NextRequest, NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { createClient } from "@supabase/supabase-js"

/**
 * API endpoint to check BTS permissions for debugging
 * 
 * This endpoint simulates the exact permission check used by the BTS API
 * to help debug role sync and permission issues.
 */
export async function POST(request: NextRequest) {
  try {
    console.log("[bts-permission-check] API called")
    
    // Check if user is authenticated
    const { userId } = auth()
    if (!userId) {
      console.log("[bts-permission-check] No authenticated user")
      return NextResponse.json({ 
        error: "Unauthorized",
        debug_info: "No authenticated user found"
      }, { status: 401 })
    }

    console.log(`[bts-permission-check] Authenticated user: ${userId}`)

    // Parse request body
    const body = await request.json()
    const { userId: targetUserId } = body
    const userIdToCheck = targetUserId || userId

    console.log(`[bts-permission-check] Checking permissions for user: ${userIdToCheck}`)

    // Create Supabase client using service role to bypass RLS
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      console.error("[bts-permission-check] Missing Supabase environment variables")
      return NextResponse.json({
        error: "Server configuration error",
        debug_info: "Missing Supabase environment variables"
      }, { status: 500 })
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY,
      {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
        },
      }
    )

    console.log("[bts-permission-check] Created Supabase service role client")

    // Check if user has admin role in user_roles table
    const { data: userRoles, error: rolesError } = await supabase
      .from('user_roles')
      .select('*')
      .eq('user_id', userIdToCheck)

    console.log(`[bts-permission-check] Query result:`, { userRoles, rolesError })

    if (rolesError) {
      console.error("[bts-permission-check] Error querying user roles:", rolesError)
      return NextResponse.json({
        error: "Database query failed",
        debug_info: rolesError,
        supabaseError: rolesError.message,
        supabaseCode: rolesError.code
      }, { status: 500 })
    }

    // Check if user has admin role
    const hasAdminRole = userRoles?.some(role => role.role === 'admin') || false
    console.log(`[bts-permission-check] User has admin role: ${hasAdminRole}`)

    // Get Clerk user metadata for comparison
    const { clerkClient } = await import("@clerk/nextjs/server")
    let clerkMetadata = null
    let isSuperAdmin = false

    try {
      const clerkUser = await clerkClient.users.getUser(userIdToCheck)
      clerkMetadata = clerkUser.publicMetadata
      isSuperAdmin = clerkUser.publicMetadata?.superAdmin === true
      console.log(`[bts-permission-check] Clerk metadata:`, { isSuperAdmin, roles: clerkMetadata?.roles })
    } catch (clerkError) {
      console.error("[bts-permission-check] Error fetching Clerk user:", clerkError)
    }

    // Simulate the exact permission check used in BTS API
    if (!hasAdminRole) {
      return NextResponse.json({
        error: "Permission denied. Admin role required.",
        debug_userIdFromAuth: userId,
        debug_targetUserId: userIdToCheck,
        debug_hasAdminRole: hasAdminRole,
        debug_userRoles: userRoles,
        debug_clerkMetadata: clerkMetadata,
        debug_isSuperAdmin: isSuperAdmin,
        supabaseError: "No admin role found",
        supabaseCode: "PERMISSION_DENIED"
      }, { status: 403 })
    }

    // Permission check passed
    return NextResponse.json({
      success: true,
      message: "BTS permission check passed",
      debug_info: {
        userId: userIdToCheck,
        hasAdminRole,
        userRoles,
        isSuperAdmin,
        clerkMetadata
      }
    })

  } catch (error) {
    console.error("[bts-permission-check] Unexpected error:", error)
    return NextResponse.json({
      error: "Internal server error",
      debug_info: error instanceof Error ? error.message : String(error),
      stack: process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.stack : undefined) : undefined
    }, { status: 500 })
  }
}