/**
 * Comprehensive Project Management Tests
 * 
 * Tests the complete project management workflow including:
 * - Project creation with admin permissions
 * - BTS image management
 * - Role-based access control
 * - Error handling and edge cases
 */

import { describe, test, expect, beforeEach, jest } from '@jest/globals'

// Set up mocks before any imports
const mockAuth = jest.fn()
const mockClerkUsers = {
  getUser: jest.fn(),
  updateUser: jest.fn()
}

const mockSupabaseFrom = jest.fn()
const mockSupabaseInsert = jest.fn()
const mockSupabaseUpdate = jest.fn()
const mockSupabaseDelete = jest.fn()
const mockSupabaseSelect = jest.fn()
const mockSupabaseEq = jest.fn()
const mockSupabaseSingle = jest.fn()

const mockSupabaseClient = {
  from: mockSupabaseFrom.mockReturnThis(),
  insert: mockSupabaseInsert.mockReturnThis(),
  update: mockSupabaseUpdate.mockReturnThis(),
  delete: mockSupabaseDelete.mockReturnThis(),
  select: mockSupabaseSelect.mockReturnThis(),
  eq: mockSupabaseEq.mockReturnThis(),
  single: mockSupabaseSingle
}

const mockNextResponseJson = jest.fn()

// Jest mocks
jest.mock('@clerk/nextjs/server', () => ({
  auth: mockAuth,
  clerkClient: {
    users: mockClerkUsers
  }
}))

jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn(() => mockSupabaseClient)
}))

jest.mock('next/server', () => ({
  NextResponse: {
    json: mockNextResponseJson
  }
}))

// Mock request object
const mockJson = jest.fn()
const mockRequest = {
  json: mockJson
} as any

// Import modules after mocking
import { POST as createProject } from '../app/api/projects/create/route'
import { POST as manageBtsImages } from '../app/api/projects/bts-images/route'
import { checkAdminPermission, ensureUserHasRole, getUserRoles } from '../lib/auth-server'

  describe('Project Management System', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    
    // Default mocks
    mockAuth.mockReturnValue({ userId: 'user_test123' })
    mockSupabaseSingle.mockResolvedValue({ data: null, error: null })
    mockSupabaseSelect.mockResolvedValue({ data: [], error: null })
    mockNextResponseJson.mockReturnValue({ status: 200 })
  })

  describe('Admin Permission Checks', () => {
    test('should grant access to users with admin role in Clerk metadata', async () => {
      // Mock user with admin role
      mockClerkUsers.getUser.mockResolvedValue({
        id: 'user_test123',
        publicMetadata: {
          roles: ['admin'],
          superAdmin: true
        }
      })

      const hasPermission = await checkAdminPermission('user_test123')
      
      expect(hasPermission).toBe(true)
      expect(mockClerkUsers.getUser).toHaveBeenCalledWith('user_test123')
    })

    test('should deny access to users without admin role', async () => {
      // Mock user without admin role
      mockClerkUsers.getUser.mockResolvedValue({
        id: 'user_test123',
        publicMetadata: {
          roles: ['viewer'],
          superAdmin: false
        }
      })

      const hasPermission = await checkAdminPermission('user_test123')
      
      expect(hasPermission).toBe(false)
    })

    test('should handle missing user gracefully', async () => {
      mockClerkUsers.getUser.mockResolvedValue(null)

      const hasPermission = await checkAdminPermission('user_nonexistent')
      
      expect(hasPermission).toBe(false)
    })

    test('should handle Clerk API errors gracefully', async () => {
      mockClerkUsers.getUser.mockRejectedValue(new Error('Clerk API error'))

      const hasPermission = await checkAdminPermission('user_test123')
      
      expect(hasPermission).toBe(false)
    })
  })

  describe('Role Management', () => {
    test('should add role to user metadata', async () => {
      // Mock user without admin role initially
      mockClerkUsers.getUser.mockResolvedValue({
        id: 'user_test123',
        publicMetadata: {
          roles: ['viewer']
        }
      })

      mockClerkUsers.updateUser.mockResolvedValue({
        id: 'user_test123',
        publicMetadata: {
          roles: ['viewer', 'admin']
        }
      })

      const result = await ensureUserHasRole('user_test123', 'admin')
      
      expect(result).toBe(true)
      expect(mockClerkUsers.updateUser).toHaveBeenCalledWith('user_test123', {
        publicMetadata: {
          roles: ['viewer', 'admin']
        }
      })
    })

    test('should not duplicate existing roles', async () => {
      // Mock user who already has admin role
      mockClerkUsers.getUser.mockResolvedValue({
        id: 'user_test123',
        publicMetadata: {
          roles: ['admin', 'viewer']
        }
      })

      const result = await ensureUserHasRole('user_test123', 'admin')
      
      expect(result).toBe(true)
      expect(mockClerkUsers.updateUser).not.toHaveBeenCalled()
    })

    test('should get user roles correctly', async () => {
      mockClerkUsers.getUser.mockResolvedValue({
        id: 'user_test123',
        publicMetadata: {
          roles: ['admin', 'editor'],
          superAdmin: true
        }
      })

      const roles = await getUserRoles('user_test123')
      
      expect(roles).toEqual(['admin', 'editor'])
    })
  })

  describe('Project Creation API', () => {
    test('should create project when user has admin permissions', async () => {
      // Mock admin user
      mockClerkUsers.getUser.mockResolvedValue({
        id: 'user_test123',
        publicMetadata: {
          roles: ['admin'],
          superAdmin: true
        }
      })

      // Mock valid project data
      const projectData = {
        title: 'Test Project',
        image: 'https://example.com/image.jpg',
        category: 'web',
        role: 'Frontend Developer'
      }

      mockJson.mockResolvedValue(projectData)

      // Mock successful database insert
      mockSupabaseselect.mockResolvedValue({
        data: [{ id: 1, ...projectData }],
        error: null
      })

      await createProject(mockRequest)

      expect(mockSupabasefrom).toHaveBeenCalledWith('projects')
      expect(mockSupabaseinsert).toHaveBeenCalledWith([projectData])
      
      // Check that mockNextResponseJson was called with success response
      expect(mockNextResponseJson).toHaveBeenCalledWith({
        success: true,
        data: [{ id: 1, ...projectData }],
        message: 'Project created successfully'
      })
    })

    test('should reject project creation for non-admin users', async () => {
      // Mock non-admin user
      mockClerkUsers.getUser.mockResolvedValue({
        id: 'user_test123',
        publicMetadata: {
          roles: ['viewer']
        }
      })

      await createProject(mockRequest)

      expect(mockSupabaseinsert).not.toHaveBeenCalled()
      expect(mockNextResponseJson).toHaveBeenCalledWith({
        error: 'Permission denied. Admin role required.',
        debug_userIdFromAuth: 'user_test123',
        supabaseError: 'No admin role found in Clerk metadata',
        supabaseCode: 'PERMISSION_DENIED'
      }, { status: 403 })
    })

    test('should reject unauthenticated requests', async () => {
      mockAuth.mockReturnValue({ userId: null })

      await createProject(mockRequest)

      expect(mockSupabaseinsert).not.toHaveBeenCalled()
      expect(mockNextResponseJson).toHaveBeenCalledWith({
        error: 'Unauthorized',
        debug_userIdFromAuth: null
      }, { status: 401 })
    })

    test('should validate required fields', async () => {
      // Mock admin user
      mockClerkUsers.getUser.mockResolvedValue({
        id: 'user_test123',
        publicMetadata: {
          roles: ['admin']
        }
      })

      // Mock incomplete project data
      const incompleteData = {
        title: 'Test Project',
        // missing image, category, role
      }

      mockJson.mockResolvedValue(incompleteData)

      await createProject(mockRequest)

      expect(mockSupabaseinsert).not.toHaveBeenCalled()
      expect(mockNextResponseJson).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: expect.stringContaining('Missing required fields')
        }),
        { status: 400 }
      )
    })

    test('should handle database errors gracefully', async () => {
      // Mock admin user
      mockClerkUsers.getUser.mockResolvedValue({
        id: 'user_test123',
        publicMetadata: {
          roles: ['admin']
        }
      })

      mockJson.mockResolvedValue({
        title: 'Test Project',
        image: 'https://example.com/image.jpg',
        category: 'web',
        role: 'Frontend Developer'
      })

      // Mock database error
      mockSupabaseselect.mockResolvedValue({
        data: null,
        error: {
          message: 'Database connection error',
          code: '500',
          hint: 'Check connection'
        }
      })

      await createProject(mockRequest)

      expect(mockNextResponseJson).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: 'Database connection error',
          debug_userIdFromAuth: 'user_test123'
        }),
        { status: 500 }
      )
    })
  })

  describe('BTS Images API', () => {
    test('should add BTS images when user has admin permissions', async () => {
      // Mock admin user
      mockClerkUsers.getUser.mockResolvedValue({
        id: 'user_test123',
        publicMetadata: {
          roles: ['admin']
        }
      })

      const btsData = {
        projectId: 'project_123',
        images: ['image1.jpg', 'image2.jpg'],
        replaceExisting: false
      }

      mockJson.mockResolvedValue(btsData)

      // Mock successful insert
      mockSupabaseselect.mockResolvedValue({
        data: [
          { id: 1, project_id: 'project_123', image_url: 'image1.jpg' },
          { id: 2, project_id: 'project_123', image_url: 'image2.jpg' }
        ],
        error: null
      })

      await manageBtsImages(mockRequest)

      expect(mockSupabasefrom).toHaveBeenCalledWith('bts_images')
      expect(mockSupabaseinsert).toHaveBeenCalledWith([
        { project_id: 'project_123', image_url: 'image1.jpg' },
        { project_id: 'project_123', image_url: 'image2.jpg' }
      ])
      expect(mockNextResponseJson).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          count: 2
        })
      )
    })

    test('should replace existing images when requested', async () => {
      // Mock admin user
      mockClerkUsers.getUser.mockResolvedValue({
        id: 'user_test123',
        publicMetadata: {
          roles: ['admin']
        }
      })

      const btsData = {
        projectId: 'project_123',
        images: ['new_image.jpg'],
        replaceExisting: true
      }

      mockJson.mockResolvedValue(btsData)

      // Mock successful delete and insert
      mockSupabaseeq.mockReturnThis()
      mockSupabaseselect.mockResolvedValue({
        data: [{ id: 3, project_id: 'project_123', image_url: 'new_image.jpg' }],
        error: null
      })

      await manageBtsImages(mockRequest)

      expect(mockSupabasedelete).toHaveBeenCalled()
      expect(mockSupabaseeq).toHaveBeenCalledWith('project_id', 'project_123')
      expect(mockSupabaseinsert).toHaveBeenCalledWith([
        { project_id: 'project_123', image_url: 'new_image.jpg' }
      ])
    })

    test('should reject BTS operations for non-admin users', async () => {
      // Mock non-admin user
      mockClerkUsers.getUser.mockResolvedValue({
        id: 'user_test123',
        publicMetadata: {
          roles: ['viewer']
        }
      })

      mockJson.mockResolvedValue({
        projectId: 'project_123',
        images: ['image1.jpg']
      })

      await manageBtsImages(mockRequest)

      expect(mockSupabaseinsert).not.toHaveBeenCalled()
      expect(mockNextResponseJson).toHaveBeenCalledWith({
        error: 'Permission denied. Admin role required.',
        debug_userIdFromAuth: 'user_test123',
        supabaseError: 'No admin role found in Clerk metadata',
        supabaseCode: 'PERMISSION_DENIED'
      }, { status: 403 })
    })

    test('should validate BTS request data', async () => {
      // Mock admin user
      mockClerkUsers.getUser.mockResolvedValue({
        id: 'user_test123',
        publicMetadata: {
          roles: ['admin']
        }
      })

      // Mock invalid data
      mockJson.mockResolvedValue({
        projectId: null,
        images: 'not-an-array'
      })

      await manageBtsImages(mockRequest)

      expect(mockSupabaseinsert).not.toHaveBeenCalled()
      expect(mockNextResponseJson).toHaveBeenCalledWith({
        error: 'Project ID and images are required',
        debug_userIdFromAuth: 'user_test123'
      }, { status: 400 })
    })
  })

  describe('Error Handling', () => {
    test('should handle unexpected errors gracefully', async () => {
      // Mock auth to throw an error
      mockAuth.mockImplementation(() => {
        throw new Error('Unexpected auth error')
      })

      await createProject(mockRequest)

      expect(mockNextResponseJson).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: expect.stringContaining('error')
        }),
        { status: 500 }
      )
    })

    test('should not expose sensitive error details in production', async () => {
      const originalEnv = process.env.NODE_ENV
      process.env.NODE_ENV = 'production'

      mockAuth.mockImplementation(() => {
        throw new Error('Sensitive error information')
      })

      await createProject(mockRequest)

      expect(mockNextResponseJson).toHaveBeenCalledWith(
        expect.objectContaining({
          stack: undefined // Should not include stack trace in production
        }),
        { status: 500 }
      )

      process.env.NODE_ENV = originalEnv
    })
  })
})