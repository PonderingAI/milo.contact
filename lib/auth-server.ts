/**
 * Server-only Authentication Utilities
 * 
 * This module provides server-side authentication utilities for Next.js server components
 * and API routes. These functions can only be used in server contexts.
 * Role management is now handled exclusively through Clerk's publicMetadata.
 * 
 * @see lib/auth-sync.ts for client-compatible authentication utilities
 */

import { clerkClient, currentUser, auth } from "@clerk/nextjs/server"
import { NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"

// Types
export type UserRole = 'admin' | 'editor' | 'viewer'

export interface RoleData {
  id: string
  user_id: string
  role: UserRole
  created_at: string
}

/**
 * Gets a Supabase client for API routes with service role privileges
 * Since we're using Clerk for authentication, we bypass RLS using service role
 * All permission checks are handled at the application layer
 */
export async function getRouteHandlerSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error("Missing Supabase environment variables. Please check your .env file.")
  }

  const { createClient } = await import('@supabase/supabase-js')
  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  })
}


/**
 * Ensures a user has the specified role in Clerk metadata
 * Updates the user's publicMetadata.roles array
 */
export async function ensureUserHasRole(userId: string, role: UserRole): Promise<boolean> {
  try {
    console.log(`[ensureUserHasRole] Starting for userId: ${userId}, role: ${role}`)
    
    // Get current user from Clerk
    const user = await clerkClient.users.getUser(userId)
    if (!user) {
      console.error(`[ensureUserHasRole] User ${userId} not found in Clerk`)
      return false
    }
    
    // Get current roles from metadata
    const currentRoles = Array.isArray(user.publicMetadata?.roles) 
      ? user.publicMetadata.roles as string[]
      : []
    
    console.log(`[ensureUserHasRole] Current roles:`, currentRoles)
    
    // Check if role already exists
    if (currentRoles.includes(role)) {
      console.log(`[ensureUserHasRole] Role ${role} already exists for user ${userId}`)
      return true
    }
    
    // Add the new role
    const updatedRoles = [...currentRoles, role]
    console.log(`[ensureUserHasRole] Adding role ${role}, updated roles:`, updatedRoles)
    
    // Update user metadata in Clerk
    await clerkClient.users.updateUser(userId, {
      publicMetadata: {
        ...user.publicMetadata,
        roles: updatedRoles
      }
    })
    
    console.log(`[ensureUserHasRole] Successfully added role ${role} to user ${userId}`)
    return true
  } catch (error) {
    console.error("[ensureUserHasRole] Error ensuring user role:", error)
    return false
  }
}

/**
 * Removes a role from a user in Clerk metadata
 * Updates the user's publicMetadata.roles array
 */
export async function removeUserRole(userId: string, role: UserRole): Promise<boolean> {
  try {
    console.log(`[removeUserRole] Starting for userId: ${userId}, role: ${role}`)
    
    // Get current user from Clerk
    const user = await clerkClient.users.getUser(userId)
    if (!user) {
      console.error(`[removeUserRole] User ${userId} not found in Clerk`)
      return false
    }
    
    // Get current roles from metadata
    const currentRoles = Array.isArray(user.publicMetadata?.roles) 
      ? user.publicMetadata.roles as string[]
      : []
    
    console.log(`[removeUserRole] Current roles:`, currentRoles)
    
    // Check if role exists to remove
    if (!currentRoles.includes(role)) {
      console.log(`[removeUserRole] Role ${role} does not exist for user ${userId}`)
      return true // Not an error if role doesn't exist
    }
    
    // Remove the role
    const updatedRoles = currentRoles.filter(r => r !== role)
    console.log(`[removeUserRole] Removing role ${role}, updated roles:`, updatedRoles)
    
    // Update user metadata in Clerk
    await clerkClient.users.updateUser(userId, {
      publicMetadata: {
        ...user.publicMetadata,
        roles: updatedRoles
      }
    })
    
    console.log(`[removeUserRole] Successfully removed role ${role} from user ${userId}`)
    return true
  } catch (error) {
    console.error("[removeUserRole] Error removing user role:", error)
    return false
  }
}

/**
 * Syncs user roles within Clerk metadata
 * Ensures superAdmin users have the admin role in their metadata
 */
export async function syncUserRoles(userId: string): Promise<boolean> {
  try {
    console.log(`[syncUserRoles] Starting sync for userId: ${userId}`)
    
    // Get user from Clerk
    console.log(`[syncUserRoles] Fetching user from Clerk`)
    const user = await clerkClient.users.getUser(userId)
    if (!user) {
      throw new Error(`User ${userId} not found in Clerk`)
    }
    
    console.log(`[syncUserRoles] Clerk user metadata:`, {
      id: user.id,
      publicMetadata: user.publicMetadata,
      isSuperAdmin: user.publicMetadata?.superAdmin === true
    })
    
    // Check if user is superAdmin in Clerk
    const isSuperAdmin = user.publicMetadata?.superAdmin === true
    
    // Get current roles from metadata
    const currentRoles = Array.isArray(user.publicMetadata?.roles) 
      ? user.publicMetadata.roles as string[]
      : []
    
    console.log(`[syncUserRoles] Current roles:`, currentRoles)
    
    // If user is superAdmin, ensure they have admin role
    if (isSuperAdmin && !currentRoles.includes('admin')) {
      console.log(`[syncUserRoles] User is superAdmin but missing admin role, adding it`)
      const adminRoleResult = await ensureUserHasRole(userId, 'admin')
      console.log(`[syncUserRoles] Admin role ensure result:`, adminRoleResult)
    }
    
    // Get final roles after sync
    const updatedUser = await clerkClient.users.getUser(userId)
    const finalRoles = Array.isArray(updatedUser.publicMetadata?.roles) 
      ? updatedUser.publicMetadata.roles as string[]
      : []
    console.log(`[syncUserRoles] Final roles for user ${userId}:`, finalRoles)
    
    return true
  } catch (error) {
    console.error("[syncUserRoles] Error syncing user roles:", error)
    return false
  }
}

/**
 * Checks if the current user has a specific role
 * For use in server components - reads from Clerk metadata
 */
export async function hasRoleServer(role: UserRole): Promise<boolean> {
  try {
    const user = await currentUser()
    if (!user) return false
    
    // Get roles from Clerk metadata
    const roles = Array.isArray(user.publicMetadata?.roles) 
      ? user.publicMetadata.roles as string[]
      : []
    
    return roles.includes(role)
  } catch (error) {
    console.error("Error checking role:", error)
    return false
  }
}

/**
 * Checks if the current user is an admin
 * For use in server components
 */
export async function isAdminServer(): Promise<boolean> {
  return hasRoleServer('admin')
}

/**
 * Checks if a user ID has admin permissions via Clerk metadata
 * Returns boolean for simple permission checks
 * Checks both superAdmin flag and admin role for comprehensive permission checking
 */
export async function checkAdminPermission(userId: string): Promise<boolean> {
  try {
    // Get user from Clerk
    const user = await clerkClient.users.getUser(userId)
    if (!user) {
      return false
    }
    
    // Check if user is superAdmin
    const isSuperAdmin = user.publicMetadata?.superAdmin === true
    
    // Check if user has admin role in metadata
    const roles = Array.isArray(user.publicMetadata?.roles) 
      ? user.publicMetadata.roles as string[]
      : []
    const hasAdminRole = roles.includes('admin')
    
    // User is admin if they are superAdmin OR have admin role
    return isSuperAdmin || hasAdminRole
  } catch (error) {
    console.error("Error checking admin permission:", error)
    return false
  }
}

/**
 * Middleware helper to check if a request is from an admin
 * For use in API routes - reads from Clerk metadata
 */
export async function requireAdmin(req: NextRequest): Promise<NextResponse | null> {
  const { userId } = auth()
  
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  
  try {
    const hasPermission = await checkAdminPermission(userId)
    
    if (!hasPermission) {
      return NextResponse.json({ error: "Permission denied" }, { status: 403 })
    }
    
    // User is admin, return null to continue processing
    return null
  } catch (error) {
    console.error("Error checking admin role:", error)
    return NextResponse.json({ error: "Error checking permissions" }, { status: 500 })
  }
}

/**
 * Gets all roles for a user from Clerk metadata
 */
export async function getUserRoles(userId: string): Promise<UserRole[]> {
  try {
    console.log(`[getUserRoles] Getting roles for user: ${userId}`)
    
    // Get user from Clerk
    const user = await clerkClient.users.getUser(userId)
    if (!user) {
      console.error(`[getUserRoles] User ${userId} not found in Clerk`)
      return []
    }
    
    // Get roles from metadata
    const roles = Array.isArray(user.publicMetadata?.roles) 
      ? user.publicMetadata.roles as UserRole[]
      : []
    
    console.log(`[getUserRoles] Found roles for user ${userId}:`, roles)
    return roles
  } catch (error) {
    console.error("Error getting user roles:", error)
    return []
  }
}



/**
 * Initializes the authentication system
 * Since we're using Clerk-only now, this mainly ensures system is ready
 */
export async function initAuthSync() {
  console.log("Clerk-only auth system initialized")
}
