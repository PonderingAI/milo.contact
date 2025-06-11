import { clerkClient } from "@clerk/nextjs/server"
import { auth } from "@clerk/nextjs/server"

/**
 * Checks if a user has a specific role
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
 * Checks if a user is an admin
 */
export async function isAdmin(userId: string): Promise<boolean> {
  return hasRole(userId, "admin")
}

/**
 * Assigns a role to a user
 */
export async function assignRole(userId: string, roleName: string): Promise<boolean> {
  try {
    console.log(`[assignRole] Assigning role ${roleName} to user ${userId}`)
    
    const user = await clerkClient.users.getUser(userId)
    const currentRoles = (user.publicMetadata.roles as string[]) || []

    console.log(`[assignRole] Current roles:`, currentRoles)

    // Don't add the role if the user already has it
    if (currentRoles.includes(roleName)) {
      console.log(`[assignRole] User already has role ${roleName}`)
      return true
    }

    // Add the new role
    const updatedRoles = [...currentRoles, roleName]
    console.log(`[assignRole] Updated roles:`, updatedRoles)

    // Update the user's metadata
    const updateResult = await clerkClient.users.updateUser(userId, {
      publicMetadata: {
        ...user.publicMetadata,
        roles: updatedRoles,
      },
    })

    console.log(`[assignRole] Update result:`, {
      userId: updateResult.id,
      updatedRoles: updateResult.publicMetadata.roles
    })

    return true
  } catch (error) {
    console.error("[assignRole] Error assigning role:", error)
    return false
  }
}

/**
 * Removes a role from a user
 */
export async function removeRole(userId: string, roleName: string): Promise<boolean> {
  try {
    const user = await clerkClient.users.getUser(userId)
    const currentRoles = (user.publicMetadata.roles as string[]) || []

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

/**
 * Gets the current user ID from the auth context
 */
export async function getCurrentUserId(): Promise<string | null> {
  const { userId } = auth()
  return userId
}

/**
 * Checks if the current user is an admin
 */
export async function isCurrentUserAdmin(): Promise<boolean> {
  const userId = await getCurrentUserId()
  if (!userId) return false
  return isAdmin(userId)
}

/**
 * Checks if a user is an admin
 */
export async function checkUserIsAdmin(userId: string): Promise<boolean> {
  return hasRole(userId, "admin")
}
