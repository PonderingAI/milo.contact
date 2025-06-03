/**
 * Server-only Authentication Utilities
 * 
 * This module provides server-side authentication utilities for Next.js server components
 * and API routes. These functions can only be used in server contexts.
 * 
 * @see lib/auth-client.ts for client-compatible authentication utilities
 */

import { createServerComponentClient, createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { SupabaseClient } from "@supabase/supabase-js"
import { cookies } from "next/headers"
import { clerkClient, currentUser, auth } from "@clerk/nextjs/server"
import { NextRequest, NextResponse } from "next/server"

// Types
export type UserRole = 'admin' | 'editor' | 'viewer'

export interface RoleData {
  id: string
  user_id: string
  role: UserRole
  created_at: string
}

/**
 * Gets an authenticated Supabase client for server components
 * Ensures proper JWT token handling
 */
export async function getServerSupabaseClient() {
  const supabase = createServerComponentClient({ cookies })
  
  // Get current Clerk user
  const user = await currentUser()
  
  if (!user) {
    return supabase
  }
  
  // Ensure roles are synced
  await syncUserRoles(user.id)
  
  return supabase
}

/**
 * Gets an authenticated Supabase client for API routes
 * This is critical for fixing the auth.uid() issue in route handlers
 */
export async function getRouteHandlerSupabaseClient(req?: NextRequest) {
  const supabase = createRouteHandlerClient({ cookies })
  
  // Get current Clerk user ID from auth()
  const { userId } = auth()
  
  if (!userId) {
    console.warn("No authenticated user found in route handler")
    return supabase
  }
  
  // Ensure roles are synced
  await syncUserRoles(userId)
  
  return supabase
}

/**
 * Syncs a Clerk user to Supabase
 * Creates or updates the Supabase user record to match Clerk
 */
export async function syncClerkUserToSupabase(userId: string) {
  try {
    // Get user from Clerk
    const clerkUser = await clerkClient.users.getUser(userId)
    if (!clerkUser) {
      throw new Error(`User ${userId} not found in Clerk`)
    }
    
    // Get Supabase admin client (bypasses RLS)
    const supabaseAdmin = createRouteHandlerClient({ cookies })
    
    // Check if user exists in Supabase auth.users
    const { data: existingUser, error: getUserError } = await supabaseAdmin.auth.admin.getUserById(userId)
    
    if (getUserError) {
      console.error("Error checking if user exists in Supabase:", getUserError)
      // Continue anyway - the user might exist but we don't have admin access
    }
    
    // If user doesn't exist in Supabase, create them
    if (!existingUser?.user) {
      // Get primary email
      const primaryEmail = clerkUser.emailAddresses.find(email => email.id === clerkUser.primaryEmailAddressId)?.emailAddress
      
      if (!primaryEmail) {
        throw new Error(`User ${userId} has no primary email address`)
      }
      
      // Create user in Supabase
      const { error: createUserError } = await supabaseAdmin.auth.admin.createUser({
        email: primaryEmail,
        email_confirm: true,
        user_metadata: {
          full_name: `${clerkUser.firstName} ${clerkUser.lastName}`.trim(),
          clerk_id: clerkUser.id
        },
        id: clerkUser.id // Use the same ID as Clerk
      })
      
      if (createUserError) {
        console.error("Error creating user in Supabase:", createUserError)
        throw createUserError
      }
    }
    
    return true
  } catch (error) {
    console.error("Error syncing user to Supabase:", error)
    return false
  }
}

/**
 * Ensures a user has the specified role in the user_roles table
 */
export async function ensureUserHasRole(userId: string, role: UserRole): Promise<boolean> {
  try {
    console.log(`[ensureUserHasRole] Starting for userId: ${userId}, role: ${role}`)
    const supabase = createRouteHandlerClient({ cookies })
    
    // Check if the role already exists
    console.log(`[ensureUserHasRole] Checking existing roles for user ${userId}`)
    const { data: existingRoles, error: checkError } = await supabase
      .from('user_roles')
      .select('*')
      .eq('user_id', userId)
      .eq('role', role)
    
    if (checkError) {
      console.error("[ensureUserHasRole] Error checking user role:", checkError)
      return false
    }
    
    console.log(`[ensureUserHasRole] Existing roles found:`, existingRoles)
    
    // If role doesn't exist, add it
    if (!existingRoles || existingRoles.length === 0) {
      console.log(`[ensureUserHasRole] Role ${role} not found, inserting for user ${userId}`)
      const { data: insertData, error: insertError } = await supabase
        .from('user_roles')
        .insert({
          user_id: userId,
          role
        })
        .select()
      
      if (insertError) {
        console.error("[ensureUserHasRole] Error assigning role:", insertError)
        return false
      }
      
      console.log(`[ensureUserHasRole] Successfully inserted role:`, insertData)
    } else {
      console.log(`[ensureUserHasRole] Role ${role} already exists for user ${userId}`)
    }
    
    return true
  } catch (error) {
    console.error("[ensureUserHasRole] Error ensuring user role:", error)
    return false
  }
}

/**
 * Removes a role from a user
 */
export async function removeUserRole(userId: string, role: UserRole): Promise<boolean> {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    
    const { error } = await supabase
      .from('user_roles')
      .delete()
      .eq('user_id', userId)
      .eq('role', role)
    
    if (error) {
      console.error("Error removing user role:", error)
      return false
    }
    
    return true
  } catch (error) {
    console.error("Error removing user role:", error)
    return false
  }
}

/**
 * Syncs user roles from Clerk metadata to Supabase user_roles table
 * This is the core function that ensures superAdmin in Clerk gets admin role in Supabase
 */
export async function syncUserRoles(userId: string): Promise<boolean> {
  try {
    console.log(`[syncUserRoles] Starting sync for userId: ${userId}`)
    
    // Ensure user exists in Supabase
    console.log(`[syncUserRoles] Ensuring user exists in Supabase`)
    const userSyncResult = await syncClerkUserToSupabase(userId)
    console.log(`[syncUserRoles] User sync result:`, userSyncResult)
    
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
    
    // If user is superAdmin, ensure they have admin role in Supabase
    if (isSuperAdmin) {
      console.log(`[syncUserRoles] User is superAdmin, ensuring admin role`)
      const adminRoleResult = await ensureUserHasRole(userId, 'admin')
      console.log(`[syncUserRoles] Admin role ensure result:`, adminRoleResult)
    }
    
    // Check if user has admin role in Clerk metadata
    const hasAdminRole = Array.isArray(user.publicMetadata?.roles) && 
      (user.publicMetadata?.roles as string[]).includes('admin')
    
    console.log(`[syncUserRoles] User has admin role in Clerk metadata:`, hasAdminRole)
    
    // If user has admin role in Clerk metadata, ensure they have it in Supabase
    if (hasAdminRole) {
      console.log(`[syncUserRoles] Ensuring admin role from Clerk metadata`)
      const adminRoleFromClerkResult = await ensureUserHasRole(userId, 'admin')
      console.log(`[syncUserRoles] Admin role from Clerk result:`, adminRoleFromClerkResult)
    }
    
    // Verify final state
    const finalRoles = await getUserRoles(userId)
    console.log(`[syncUserRoles] Final roles for user ${userId}:`, finalRoles)
    
    return true
  } catch (error) {
    console.error("[syncUserRoles] Error syncing user roles:", error)
    return false
  }
}

/**
 * Checks if the current user has a specific role
 * For use in server components
 */
export async function hasRoleServer(role: UserRole): Promise<boolean> {
  try {
    const user = await currentUser()
    if (!user) return false
    
    // Ensure roles are synced
    await syncUserRoles(user.id)
    
    const supabase = createServerComponentClient({ cookies })
    
    const { data, error } = await supabase
      .from('user_roles')
      .select('*')
      .eq('user_id', user.id)
      .eq('role', role)
    
    if (error) {
      console.error("Error checking role:", error)
      return false
    }
    
    return data && data.length > 0
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
 * Middleware helper to check if a request is from an admin
 * For use in API routes
 */
export async function requireAdmin(req: NextRequest): Promise<NextResponse | null> {
  const { userId } = auth()
  
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  
  // Sync roles to ensure they're up to date
  await syncUserRoles(userId)
  
  // Check if user has admin role
  const supabase = createRouteHandlerClient({ cookies })
  
  const { data, error } = await supabase
    .from('user_roles')
    .select('*')
    .eq('user_id', userId)
    .eq('role', 'admin')
  
  if (error || !data || data.length === 0) {
    return NextResponse.json({ error: "Permission denied" }, { status: 403 })
  }
  
  // User is admin, return null to continue processing
  return null
}

/**
 * Gets all roles for a user
 */
export async function getUserRoles(userId: string): Promise<UserRole[]> {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    
    const { data, error } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', userId)
    
    if (error) {
      console.error("Error getting user roles:", error)
      return []
    }
    
    return (data || []).map(r => r.role as UserRole)
  } catch (error) {
    console.error("Error getting user roles:", error)
    return []
  }
}

/**
 * Initializes the authentication system
 * Call this on app startup to ensure everything is set up
 */
export async function initAuthSync() {
  // This is a placeholder for any initialization logic
  // Could be expanded to check and create necessary database tables, etc.
  console.log("Auth sync system initialized")
}
