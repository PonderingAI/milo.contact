import { auth } from "@clerk/nextjs/server"
import { isAdmin } from "./auth-utils"

/**
 * Get the current authenticated user ID
 */
export function getCurrentUserId(): string | null {
  const { userId } = auth()
  return userId
}

/**
 * Check if the current user is an admin
 */
export async function isCurrentUserAdmin(): Promise<boolean> {
  const userId = getCurrentUserId()
  if (!userId) return false
  return isAdmin(userId)
}
