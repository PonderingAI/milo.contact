/**
 * Final validation test that reproduces the exact issue scenario
 * 
 * This test ensures the specific error from the GitHub issue is resolved:
 * "Permission denied. Admin role required." when user_2wQ5fVbZnlsXpNy0slPZoYOZl1V
 * tries to make a public project private.
 */

import { checkAdminPermission } from '../lib/auth-server'

// Mock Clerk
jest.mock('@clerk/nextjs/server', () => ({
  clerkClient: {
    users: {
      getUser: jest.fn()
    }
  }
}))

const mockClerkClient = require('@clerk/nextjs/server').clerkClient

describe('GitHub Issue Fix Validation', () => {
  test('user_2wQ5fVbZnlsXpNy0slPZoYOZl1V should now have admin permissions', async () => {
    // Mock the exact user ID from the GitHub issue
    const problematicUserId = 'user_2wQ5fVbZnlsXpNy0slPZoYOZl1V'
    
    // Mock user with superAdmin flag (which was being ignored before the fix)
    mockClerkClient.users.getUser.mockResolvedValue({
      id: problematicUserId,
      publicMetadata: {
        superAdmin: true,
        roles: [] // Empty roles array - this was the cause of the original bug
      }
    })

    // This should now return true with our fix
    const hasPermission = await checkAdminPermission(problematicUserId)
    
    expect(hasPermission).toBe(true)
    expect(mockClerkClient.users.getUser).toHaveBeenCalledWith(problematicUserId)
  })

  test('should not get "Permission denied. Admin role required." error anymore', async () => {
    // The fix ensures that checkAdminPermission returns true for superAdmin users
    // which means API routes like projects/update/[id] will not return the permission denied error
    
    const userId = 'user_2wQ5fVbZnlsXpNy0slPZoYOZl1V'
    
    mockClerkClient.users.getUser.mockResolvedValue({
      id: userId,
      publicMetadata: {
        superAdmin: true
      }
    })

    const hasPermission = await checkAdminPermission(userId)
    
    // With the fix, this will be true, preventing the error:
    // "Permission denied. Admin role required."
    // "No admin role found in Clerk metadata"
    expect(hasPermission).toBe(true)
  })
})