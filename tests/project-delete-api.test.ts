/**
 * Project Delete API Tests
 * 
 * Tests the project deletion endpoint with proper error handling
 */

import { describe, test, expect, beforeEach, jest } from '@jest/globals'

// Set up mocks before any imports
const mockAuth = jest.fn()
const mockClerkUsers = {
  getUser: jest.fn(),
  updateUser: jest.fn()
}

const mockSupabaseFrom = jest.fn()
const mockSupabaseDelete = jest.fn()
const mockSupabaseSelect = jest.fn()
const mockSupabaseEq = jest.fn()

const mockSupabaseClient = {
  from: jest.fn().mockImplementation(() => ({
    delete: jest.fn().mockImplementation(() => ({
      eq: jest.fn().mockImplementation(() => ({
        select: jest.fn().mockImplementation(() => mockSupabaseEq())
      }))
    }))
  }))
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

jest.mock('@/lib/auth-server', () => ({
  getRouteHandlerSupabaseClient: jest.fn(() => mockSupabaseClient),
  checkAdminPermission: jest.fn()
}))

describe('Project Delete API', () => {
  let deleteHandler: any
  let mockCheckAdminPermission: any

  beforeEach(() => {
    jest.clearAllMocks()
    
    // Reset all mocks
    mockAuth.mockReturnValue({ userId: 'test-user-id' })
    mockNextResponseJson.mockImplementation((data, options) => ({
      json: async () => data,
      status: options?.status || 200
    }))

    // Import after mocks are set up
    mockCheckAdminPermission = require('@/lib/auth-server').checkAdminPermission
    mockCheckAdminPermission.mockResolvedValue(true)

    // Dynamically import the handler
    return import('../app/api/projects/delete/route').then(module => {
      deleteHandler = module.DELETE
    })
  })

  describe('DELETE /api/projects/delete', () => {
    test('should successfully delete a project with valid ID', async () => {
      const mockProjectData = { id: 'test-project-id', title: 'Test Project' }
      
      // Mock successful BTS deletion
      mockSupabaseEq.mockResolvedValueOnce({ data: [], error: null })
      
      // Mock successful project deletion
      mockSupabaseEq.mockResolvedValueOnce({ 
        data: [mockProjectData], 
        error: null 
      })

      const request = {
        json: jest.fn().mockResolvedValue({ id: 'test-project-id' })
      }

      await deleteHandler(request)

      expect(mockSupabaseFrom).toHaveBeenCalledWith('project_bts_images')
      expect(mockSupabaseFrom).toHaveBeenCalledWith('projects')
      expect(mockSupabaseDelete).toHaveBeenCalled()
      expect(mockSupabaseEq).toHaveBeenCalledWith('project_id', 'test-project-id')
      expect(mockSupabaseEq).toHaveBeenCalledWith('id', 'test-project-id')
      expect(mockNextResponseJson).toHaveBeenCalledWith({
        success: true,
        data: [mockProjectData],
        message: 'Project deleted successfully'
      })
    })

    test('should return 401 when user is not authenticated', async () => {
      mockAuth.mockReturnValue({ userId: null })

      const request = {
        json: jest.fn().mockResolvedValue({ id: 'test-project-id' })
      }

      await deleteHandler(request)

      expect(mockNextResponseJson).toHaveBeenCalledWith(
        {
          error: 'Unauthorized',
          debug_userIdFromAuth: null
        },
        { status: 401 }
      )
    })

    test('should return 403 when user lacks admin permission', async () => {
      mockCheckAdminPermission.mockResolvedValue(false)

      const request = {
        json: jest.fn().mockResolvedValue({ id: 'test-project-id' })
      }

      await deleteHandler(request)

      expect(mockNextResponseJson).toHaveBeenCalledWith(
        {
          error: 'Permission denied. Admin role required.',
          debug_userIdFromAuth: 'test-user-id',
          supabaseError: 'No admin role found in Clerk metadata',
          supabaseCode: 'PERMISSION_DENIED'
        },
        { status: 403 }
      )
    })

    test('should return 400 when project ID is missing', async () => {
      const request = {
        json: jest.fn().mockResolvedValue({ })
      }

      await deleteHandler(request)

      expect(mockNextResponseJson).toHaveBeenCalledWith(
        {
          success: false,
          error: 'Missing project ID',
          details: 'Project ID is required for deletion.',
          debug_userIdFromAuth: 'test-user-id'
        },
        { status: 400 }
      )
    })

    test('should return 404 when project is not found', async () => {
      // Mock successful BTS deletion
      mockSupabaseEq.mockResolvedValueOnce({ data: [], error: null })
      
      // Mock project not found
      mockSupabaseEq.mockResolvedValueOnce({ 
        data: [], 
        error: null 
      })

      const request = {
        json: jest.fn().mockResolvedValue({ id: 'non-existent-id' })
      }

      await deleteHandler(request)

      expect(mockNextResponseJson).toHaveBeenCalledWith(
        {
          success: false,
          error: 'Project not found',
          details: 'No project found with the specified ID.',
          debug_userIdFromAuth: 'test-user-id'
        },
        { status: 404 }
      )
    })

    test('should handle database error gracefully', async () => {
      const dbError = { 
        message: 'Database connection failed', 
        code: 'CONNECTION_ERROR',
        hint: 'Check database connectivity'
      }
      
      // Mock BTS deletion success
      mockSupabaseEq.mockResolvedValueOnce({ data: [], error: null })
      
      // Mock project deletion failure
      mockSupabaseEq.mockResolvedValueOnce({ 
        data: null, 
        error: dbError 
      })

      const request = {
        json: jest.fn().mockResolvedValue({ id: 'test-project-id' })
      }

      await deleteHandler(request)

      expect(mockNextResponseJson).toHaveBeenCalledWith(
        {
          success: false,
          error: dbError.message,
          details: `Database error: ${dbError.message}`,
          code: dbError.code,
          hint: dbError.hint,
          debug_userIdFromAuth: 'test-user-id',
          supabaseError: dbError.message,
          supabaseCode: dbError.code
        },
        { status: 500 }
      )
    })

    test('should continue with project deletion even if BTS deletion fails', async () => {
      const mockProjectData = { id: 'test-project-id', title: 'Test Project' }
      
      // Mock BTS deletion failure
      mockSupabaseEq.mockResolvedValueOnce({ 
        data: null, 
        error: { message: 'BTS deletion failed' } 
      })
      
      // Mock successful project deletion
      mockSupabaseEq.mockResolvedValueOnce({ 
        data: [mockProjectData], 
        error: null 
      })

      const request = {
        json: jest.fn().mockResolvedValue({ id: 'test-project-id' })
      }

      await deleteHandler(request)

      expect(mockNextResponseJson).toHaveBeenCalledWith({
        success: true,
        data: [mockProjectData],
        message: 'Project deleted successfully'
      })
    })
  })
})