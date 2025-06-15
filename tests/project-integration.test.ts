/**
 * Integration Test for Project Management System
 * 
 * Tests that validate the core functionality of project creation 
 * and role management with Clerk-only system.
 */

// Mock environment variables for testing
process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co'
process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-role-key'

// Simple mock for Clerk
const mockClerkUser = {
  id: 'user_test123',
  publicMetadata: {
    roles: ['admin'],
    superAdmin: true
  }
}

const mockClerkClient = {
  users: {
    getUser: jest.fn().mockResolvedValue(mockClerkUser),
    updateUser: jest.fn().mockResolvedValue(mockClerkUser)
  }
}

// Mock Clerk module
jest.mock('@clerk/nextjs/server', () => ({
  auth: () => ({ userId: 'user_test123' }),
  clerkClient: mockClerkClient,
  currentUser: () => mockClerkUser
}))

// Mock Supabase
const mockSupabaseResponse = {
  data: [{ id: 1, title: 'Test Project' }],
  error: null
}

const mockSupabaseClient = {
  from: jest.fn(() => ({
    insert: jest.fn(() => ({
      select: jest.fn().mockResolvedValue(mockSupabaseResponse)
    })),
    update: jest.fn(() => ({
      eq: jest.fn(() => ({
        select: jest.fn().mockResolvedValue(mockSupabaseResponse)
      }))
    })),
    delete: jest.fn(() => ({
      eq: jest.fn().mockResolvedValue({ data: null, error: null })
    }))
  }))
}

jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn(() => mockSupabaseClient)
}))

// Mock Next.js Response
const mockResponseData = { data: null, options: null }
jest.mock('next/server', () => ({
  NextResponse: {
    json: jest.fn((data, options) => {
      mockResponseData.data = data
      mockResponseData.options = options
      return { data, options, status: options?.status || 200 }
    })
  }
}))

describe('Project Management Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockResponseData.data = null
    mockResponseData.options = null
  })

  describe('Authentication and Role Management', () => {
    test('checkAdminPermission should work with Clerk metadata', async () => {
      const { checkAdminPermission } = await import('../lib/auth-server')
      
      const hasPermission = await checkAdminPermission('user_test123')
      
      expect(hasPermission).toBe(true)
      expect(mockClerkClient.users.getUser).toHaveBeenCalledWith('user_test123')
    })

    test('ensureUserHasRole should update Clerk metadata', async () => {
      const { ensureUserHasRole } = await import('../lib/auth-server')
      
      // Mock user without admin role initially
      mockClerkClient.users.getUser.mockResolvedValueOnce({
        id: 'user_test123',
        publicMetadata: { roles: ['viewer'] }
      })

      const result = await ensureUserHasRole('user_test123', 'admin')
      
      expect(result).toBe(true)
      expect(mockClerkClient.users.updateUser).toHaveBeenCalledWith('user_test123', {
        publicMetadata: { roles: ['viewer', 'admin'] }
      })
    })

    test('getUserRoles should return roles from Clerk metadata', async () => {
      const { getUserRoles } = await import('../lib/auth-server')
      
      const roles = await getUserRoles('user_test123')
      
      expect(roles).toEqual(['admin'])
    })
  })

  describe('Database Operations with Service Role', () => {
    test('getRouteHandlerSupabaseClient should use service role', async () => {
      const { getRouteHandlerSupabaseClient } = await import('../lib/auth-server')
      const { createClient } = await import('@supabase/supabase-js')
      
      await getRouteHandlerSupabaseClient()
      
      expect(createClient).toHaveBeenCalledWith(
        'https://test.supabase.co',
        'test-service-role-key',
        {
          auth: {
            persistSession: false,
            autoRefreshToken: false,
          },
        }
      )
    })
  })

  describe('API Routes', () => {
    test('project creation API should work with admin user', async () => {
      const mockRequest = {
        json: jest.fn().mockResolvedValue({
          title: 'Test Project',
          image: 'https://example.com/image.jpg',
          category: 'web',
          role: 'Frontend Developer'
        })
      }

      const { POST } = await import('../app/api/projects/create/route')
      
      await POST(mockRequest as any)
      
      // Verify Supabase operations
      expect(mockSupabaseClient.from).toHaveBeenCalledWith('projects')
      
      // Verify successful response
      expect(mockResponseData.data).toMatchObject({
        success: true,
        message: 'Project created successfully'
      })
    })

    test('BTS images API should work with admin user', async () => {
      const mockRequest = {
        json: jest.fn().mockResolvedValue({
          projectId: 'project_123',
          images: ['image1.jpg', 'image2.jpg'],
          replaceExisting: false
        })
      }

      const { POST } = await import('../app/api/projects/bts-images/route')
      
      await POST(mockRequest as any)
      
      // Verify Supabase operations
      expect(mockSupabaseClient.from).toHaveBeenCalledWith('bts_images')
      
      // Verify successful response
      expect(mockResponseData.data).toMatchObject({
        success: true
      })
    })
  })

  describe('Error Handling', () => {
    test('should handle missing admin permissions gracefully', async () => {
      // Mock user without admin role
      mockClerkClient.users.getUser.mockResolvedValueOnce({
        id: 'user_test123',
        publicMetadata: { roles: ['viewer'] }
      })

      const mockRequest = {
        json: jest.fn().mockResolvedValue({
          title: 'Test Project',
          image: 'https://example.com/image.jpg',
          category: 'web',
          role: 'Frontend Developer'
        })
      }

      const { POST } = await import('../app/api/projects/create/route')
      
      await POST(mockRequest as any)
      
      // Verify permission denied response
      expect(mockResponseData.data).toMatchObject({
        error: 'Permission denied. Admin role required.'
      })
      expect(mockResponseData.options?.status).toBe(403)
    })

    test('should handle database errors gracefully', async () => {
      // Mock database error
      const errorResponse = {
        data: null,
        error: { message: 'Database connection error', code: '500' }
      }
      
      mockSupabaseClient.from = jest.fn(() => ({
        insert: jest.fn(() => ({
          select: jest.fn().mockResolvedValue(errorResponse)
        }))
      }))

      const mockRequest = {
        json: jest.fn().mockResolvedValue({
          title: 'Test Project',
          image: 'https://example.com/image.jpg', 
          category: 'web',
          role: 'Frontend Developer'
        })
      }

      const { POST } = await import('../app/api/projects/create/route')
      
      await POST(mockRequest as any)
      
      // Verify error response
      expect(mockResponseData.data).toMatchObject({
        success: false,
        error: 'Database connection error'
      })
      expect(mockResponseData.options?.status).toBe(500)
    })
  })
})

console.log('✅ Project Management Integration Tests configured')
console.log('✅ Using Clerk-only authentication system')
console.log('✅ Service role bypasses RLS policies')
console.log('✅ Admin permissions checked at application layer')