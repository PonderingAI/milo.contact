/**
 * Authentication Utilities for Client Components
 * 
 * This module provides client-compatible authentication utilities.
 * Role management is now handled exclusively through Clerk's publicMetadata.
 * For server-only functions, see lib/auth-server.ts
 */

import { useUser } from "@clerk/nextjs"

// Types
export type UserRole = 'admin' | 'editor' | 'viewer'

export interface RoleData {
  id: string
  user_id: string
  role: UserRole
  created_at: string
}

/**
 * Custom hook to check if a user has a specific role
 * For use in client components - reads from Clerk metadata
 */
export function useHasRole(role: UserRole): boolean {
  const { user } = useUser()
  
  try {
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
 * Custom hook to check if a user is an admin
 * For use in client components - reads from Clerk metadata
 */
export function useIsAdmin(): boolean {
  return useHasRole('admin')
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
