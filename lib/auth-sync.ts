/**
 * Authentication Utilities for Client Components
 * 
 * This module provides client-compatible authentication utilities.
 * For server-only functions, see lib/auth-server.ts
 */

import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"

// Types
export type UserRole = 'admin' | 'editor' | 'viewer'

export interface RoleData {
  id: string
  user_id: string
  role: UserRole
  created_at: string
}

/**
 * Gets an authenticated Supabase client for client components
 */
export function getClientSupabaseClient() {
  return createClientComponentClient()
}

/**
 * Checks if a user has a specific role
 * For use in client components
 */
export async function hasRoleClient(userId: string, role: UserRole): Promise<boolean> {
  try {
    const supabase = createClientComponentClient()
    
    const { data, error } = await supabase
      .from('user_roles')
      .select('*')
      .eq('user_id', userId)
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
 * Checks if a user is an admin
 * For use in client components
 */
export async function isAdminClient(userId: string): Promise<boolean> {
  return hasRoleClient(userId, 'admin')
}

/**
 * Assigns a role to a user
 * This is a client-side helper that calls the API
 */
export async function assignRoleClient(userId: string, role: UserRole): Promise<boolean> {
  try {
    const response = await fetch('/api/admin/toggle-role', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        userId,
        role,
        action: 'add'
      })
    })
    
    if (!response.ok) {
      const data = await response.json()
      throw new Error(data.error || 'Failed to assign role')
    }
    
    return true
  } catch (error) {
    console.error("Error assigning role:", error)
    return false
  }
}

/**
 * Removes a role from a user
 * This is a client-side helper that calls the API
 */
export async function removeRoleClient(userId: string, role: UserRole): Promise<boolean> {
  try {
    const response = await fetch('/api/admin/toggle-role', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        userId,
        role,
        action: 'remove'
      })
    })
    
    if (!response.ok) {
      const data = await response.json()
      throw new Error(data.error || 'Failed to remove role')
    }
    
    return true
  } catch (error) {
    console.error("Error removing role:", error)
    return false
  }
}

/**
 * Syncs roles for the current user
 * This is a client-side helper that calls the API
 */
export async function syncCurrentUserRoles(): Promise<boolean> {
  try {
    const response = await fetch('/api/admin/sync-roles', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    })
    
    if (!response.ok) {
      const data = await response.json()
      throw new Error(data.error || 'Failed to sync roles')
    }
    
    return true
  } catch (error) {
    console.error("Error syncing roles:", error)
    return false
  }
}
