import { clerkClient } from "@clerk/nextjs"

export type UserRole = {
  id: string
  name: string
  description: string
}

/**
 * Check if a user has a specific role
 */
export async function hasRole(userId: string, roleName: string): Promise<boolean> {
  try {
    const user = await clerkClient.users.getUser(userId)
    const roles = (user.publicMetadata.roles as string[]) || []
    return roles.includes(roleName)
  } catch (error) {
    console.error("Error checking role:", error)
    return false
  }
}

/**
 * Check if a user is an admin
 */
export async function isAdmin(userId: string): Promise<boolean> {
  return hasRole(userId, "admin")
}

/**
 * Assign a role to a user
 */
export async function assignRole(userId: string, roleName: string): Promise<boolean> {
  try {
    const user = await clerkClient.users.getUser(userId)
    const currentRoles = (user.publicMetadata.roles as string[]) || []

    // Check if user already has the role
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

/**
 * Remove a role from a user
 */
export async function removeRole(userId: string, roleName: string): Promise<boolean> {
  try {
    const user = await clerkClient.users.getUser(userId)
    const currentRoles = (user.publicMetadata.roles as string[]) || []

    // Check if user has the role
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
