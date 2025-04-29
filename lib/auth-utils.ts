import { clerkClient } from "@clerk/nextjs"
import { auth } from "@clerk/nextjs/server"

export interface UserRole {
  id: string
  name: string
  description: string
}

// Get all roles for a user using Clerk's metadata
export async function getUserRoles(userId: string): Promise<UserRole[]> {
  try {
    const user = await clerkClient.users.getUser(userId)

    // Get roles from user's public metadata
    const roles = (user.publicMetadata.roles as string[]) || []

    // Convert to UserRole objects
    return roles.map((role) => ({
      id: role,
      name: role,
      description: `${role} role`,
    }))
  } catch (error) {
    console.error("Error fetching user roles:", error)
    return []
  }
}

// Check if a user has a specific role
export async function hasRole(userId: string, roleName: string): Promise<boolean> {
  try {
    const user = await clerkClient.users.getUser(userId)
    const roles = (user.publicMetadata.roles as string[]) || []
    return roles.includes(roleName)
  } catch (error) {
    console.error("Error checking user role:", error)
    return false
  }
}

// Check if a user has admin role
export async function isAdmin(userId: string): Promise<boolean> {
  return hasRole(userId, "admin")
}

// Assign a role to a user
export async function assignRole(userId: string, roleName: string): Promise<boolean> {
  try {
    const user = await clerkClient.users.getUser(userId)
    const currentRoles = (user.publicMetadata.roles as string[]) || []

    // If user already has this role, return true
    if (currentRoles.includes(roleName)) {
      return true
    }

    // Add the new role
    const updatedRoles = [...currentRoles, roleName]

    // Update the user's metadata
    await clerkClient.users.updateUser(userId, {
      publicMetadata: {
        ...user.publicMetadata,
        roles: updatedRoles,
      },
    })

    return true
  } catch (error) {
    console.error("Error assigning role:", error)
    return false
  }
}

// Remove a role from a user
export async function removeRole(userId: string, roleName: string): Promise<boolean> {
  try {
    const user = await clerkClient.users.getUser(userId)
    const currentRoles = (user.publicMetadata.roles as string[]) || []

    // If user doesn't have this role, return true
    if (!currentRoles.includes(roleName)) {
      return true
    }

    // Remove the role
    const updatedRoles = currentRoles.filter((role) => role !== roleName)

    // Update the user's metadata
    await clerkClient.users.updateUser(userId, {
      publicMetadata: {
        ...user.publicMetadata,
        roles: updatedRoles,
      },
    })

    return true
  } catch (error) {
    console.error("Error removing role:", error)
    return false
  }
}

// Get the current user's ID
export async function getCurrentUserId(): Promise<string | null> {
  const { userId } = auth()
  return userId
}

// Check if the current user is an admin
export async function isCurrentUserAdmin(): Promise<boolean> {
  const userId = await getCurrentUserId()
  if (!userId) return false
  return isAdmin(userId)
}
