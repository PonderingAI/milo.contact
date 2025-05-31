import { NextRequest, NextResponse } from "next/server"
import { auth, clerkClient } from "@clerk/nextjs"
import { syncUserRoles, ensureUserHasRole, getUserRoles } from "@/lib/auth-sync"

/**
 * API route to synchronize user roles between Clerk and Supabase
 * 
 * This endpoint:
 * 1. Syncs roles from Clerk metadata to Supabase user_roles table
 * 2. Automatically assigns admin role to superAdmin users
 * 3. Can be used to sync roles for the current user or another user (if requester is superAdmin)
 */
export async function POST(request: NextRequest) {
  try {
    // Check if the requesting user is authenticated
    const { userId: requestingUserId } = auth()
    
    if (!requestingUserId) {
      return NextResponse.json({ 
        error: "Unauthorized. You must be signed in to perform this action." 
      }, { status: 401 })
    }
    
    // Parse request body to get the target userId
    const body = await request.json()
    const { userId: targetUserId } = body
    
    // If no targetUserId provided, use the requesting user's ID
    const userIdToSync = targetUserId || requestingUserId
    
    // If trying to sync roles for another user, verify the requesting user is a superAdmin
    if (targetUserId && targetUserId !== requestingUserId) {
      // Get the requesting user from Clerk
      const requestingUser = await clerkClient.users.getUser(requestingUserId)
      const isSuperAdmin = requestingUser.publicMetadata?.superAdmin === true
      
      if (!isSuperAdmin) {
        return NextResponse.json({ 
          error: "Permission denied. Only superAdmins can sync roles for other users.",
          debug: {
            requestingUserId,
            targetUserId,
            isSuperAdmin: false
          }
        }, { status: 403 })
      }
    }
    
    // Get the target user from Clerk
    const targetUser = await clerkClient.users.getUser(userIdToSync)
    
    // Check if the user is a superAdmin in Clerk
    const isSuperAdmin = targetUser.publicMetadata?.superAdmin === true
    
    // Get existing roles array from Clerk metadata
    const clerkRoles = Array.isArray(targetUser.publicMetadata?.roles) 
      ? targetUser.publicMetadata.roles as string[]
      : []
    
    // Sync all roles from Clerk to Supabase
    await syncUserRoles(userIdToSync)
    
    // If user is superAdmin, ensure they have the admin role
    if (isSuperAdmin) {
      await ensureUserHasRole(userIdToSync, 'admin')
    }
    
    // Get the updated roles from Supabase after syncing
    const supabaseRoles = await getUserRoles(userIdToSync)
    
    // Return success with debug information
    return NextResponse.json({
      success: true,
      message: "User roles synchronized successfully",
      debug: {
        userId: userIdToSync,
        isSuperAdmin,
        clerkRoles,
        supabaseRoles,
        adminRoleAssigned: isSuperAdmin || clerkRoles.includes('admin') || supabaseRoles.includes('admin')
      }
    })
    
  } catch (error) {
    console.error("Error syncing user roles:", error)
    
    return NextResponse.json({ 
      error: "Failed to sync user roles",
      message: error instanceof Error ? error.message : "Unknown error occurred",
      stack: process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.stack : undefined) : undefined
    }, { status: 500 })
  }
}
