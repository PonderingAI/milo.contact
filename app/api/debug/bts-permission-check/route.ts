import { NextRequest, NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { checkAdminPermission } from "@/lib/auth-server"

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

    // Check if user has admin role via Clerk metadata (new system)
    const hasAdminRole = await checkAdminPermission(userIdToCheck)
    console.log(`[bts-permission-check] User has admin role (Clerk): ${hasAdminRole}`)

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
      return NextResponse.json({
        error: "Error fetching user data",
        debug_info: clerkError instanceof Error ? clerkError.message : String(clerkError)
      }, { status: 500 })
    }

    // Simulate the exact permission check used in BTS API (now using Clerk)
    if (!hasAdminRole) {
      return NextResponse.json({
        error: "Permission denied. Admin role required.",
        debug_userIdFromAuth: userId,
        debug_targetUserId: userIdToCheck,
        debug_hasAdminRole: hasAdminRole,
        debug_clerkMetadata: clerkMetadata,
        debug_isSuperAdmin: isSuperAdmin,
        supabaseError: "No admin role found in Clerk metadata",
        supabaseCode: "PERMISSION_DENIED"
      }, { status: 403 })
    }

    // Permission check passed
    return NextResponse.json({
      success: true,
      message: "BTS permission check passed (Clerk-only system)",
      debug_info: {
        userId: userIdToCheck,
        hasAdminRole,
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