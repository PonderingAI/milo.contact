/**
 * Test for the specific auth bug where superAdmin users can't make projects private
 * 
 * This test specifically reproduces the issue described in the GitHub issue:
 * Users with superAdmin: true but no 'admin' role in their roles array
 * are being denied permission when trying to update projects.
 */

import { checkAdminPermission } from '../lib/auth-server'

// Mock Clerk
jest.mock('@clerk/nextjs/server', () => ({
  clerkClient: {
    users: {
      getUser: jest.fn(),
      updateUser: jest.fn()
    }
  },
  auth: jest.fn(),
  currentUser: jest.fn()
}))

const mockClerkClient = require('@clerk/nextjs/server').clerkClient

describe('SuperAdmin Auth Bug', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('checkAdminPermission', () => {
    test('should grant permission to user with superAdmin flag but no admin role', async () => {
      // This test reproduces the bug: user has superAdmin: true but no 'admin' in roles array
      mockClerkClient.users.getUser.mockResolvedValue({
        id: 'user_2wQ5fVbZnlsXpNy0slPZoYOZl1V',
        publicMetadata: {
          superAdmin: true,
          roles: [] // No admin role in array
        }
      })

      const hasPermission = await checkAdminPermission('user_2wQ5fVbZnlsXpNy0slPZoYOZl1V')
      
      // This should be true but currently fails due to the bug
      expect(hasPermission).toBe(true)
    })

    test('should grant permission to user with admin role but no superAdmin flag', async () => {
      mockClerkClient.users.getUser.mockResolvedValue({
        id: 'user_test123',
        publicMetadata: {
          superAdmin: false,
          roles: ['admin']
        }
      })

      const hasPermission = await checkAdminPermission('user_test123')
      
      expect(hasPermission).toBe(true)
    })

    test('should grant permission to user with both superAdmin flag and admin role', async () => {
      mockClerkClient.users.getUser.mockResolvedValue({
        id: 'user_test123',
        publicMetadata: {
          superAdmin: true,
          roles: ['admin']
        }
      })

      const hasPermission = await checkAdminPermission('user_test123')
      
      expect(hasPermission).toBe(true)
    })

    test('should deny permission to user with neither superAdmin flag nor admin role', async () => {
      mockClerkClient.users.getUser.mockResolvedValue({
        id: 'user_test123',
        publicMetadata: {
          superAdmin: false,
          roles: ['viewer']
        }
      })

      const hasPermission = await checkAdminPermission('user_test123')
      
      expect(hasPermission).toBe(false)
    })

    test('should handle missing publicMetadata gracefully', async () => {
      mockClerkClient.users.getUser.mockResolvedValue({
        id: 'user_test123',
        publicMetadata: null
      })

      const hasPermission = await checkAdminPermission('user_test123')
      
      expect(hasPermission).toBe(false)
    })

    test('should handle missing roles array gracefully', async () => {
      mockClerkClient.users.getUser.mockResolvedValue({
        id: 'user_test123',
        publicMetadata: {
          superAdmin: true
          // No roles array
        }
      })

      const hasPermission = await checkAdminPermission('user_test123')
      
      expect(hasPermission).toBe(true)
    })
  })
})