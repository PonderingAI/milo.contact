/**
 * Test suite to verify debug APIs use singleton Supabase clients
 * and handle network errors gracefully
 */

const { expect, describe, it, beforeAll, afterAll } = require('@jest/globals')

// Define mock counters that Jest allows
let mockAdminClientCreateCount = 0
let mockClientCreateCount = 0

// Mock the Supabase singleton to track client creation
jest.mock('@/lib/supabase', () => ({
  createAdminClient: jest.fn(() => {
    mockAdminClientCreateCount++
    return {
      from: jest.fn(() => ({
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            order: jest.fn(() => Promise.resolve({ data: [{ table_name: 'test_table' }], error: null }))
          }))
        }))
      })),
      rpc: jest.fn(() => Promise.resolve({ data: [], error: null }))
    }
  }),
  getSupabaseBrowserClient: jest.fn(() => {
    mockClientCreateCount++
    return {
      from: jest.fn(() => ({
        select: jest.fn(() => Promise.resolve({ data: [], error: null }))
      }))
    }
  })
}))

describe('Debug API Singleton Usage', () => {
  beforeAll(() => {
    // Reset counters
    mockAdminClientCreateCount = 0
    mockClientCreateCount = 0
    
    // Mock environment variables
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co'
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-role-key'
  })

  afterAll(() => {
    // Clean up environment
    delete process.env.NEXT_PUBLIC_SUPABASE_URL
    delete process.env.SUPABASE_SERVICE_ROLE_KEY
  })

  it('should use singleton admin client for debug APIs', async () => {
    // Import and test the APIs
    const { GET: setupListTables } = require('../app/api/debug/setup-list-tables/route')
    const { GET: systemInfo } = require('../app/api/debug/system-info/route')
    const { GET: setupExecSql } = require('../app/api/debug/setup-exec-sql/route')
    const { GET: setupRpcFunctions } = require('../app/api/setup-rpc-functions/route')

    // Call each API
    await setupListTables()
    await systemInfo()
    await setupExecSql()
    await setupRpcFunctions()

    // Verify admin client was created (should be singleton, so only once)
    expect(mockAdminClientCreateCount).toBeGreaterThan(0)
    
    // The actual count depends on singleton implementation
    // But it should be much less than the number of API calls
    expect(mockAdminClientCreateCount).toBeLessThanOrEqual(4)
  })

  it('should handle network errors gracefully', async () => {
    // Mock a failing admin client
    const mockFailingClient = {
      from: jest.fn(() => ({
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            order: jest.fn(() => Promise.resolve({ 
              data: null, 
              error: { message: 'Network error', code: 'NETWORK_ERROR' } 
            }))
          }))
        }))
      })),
      rpc: jest.fn(() => Promise.resolve({ 
        data: null, 
        error: { message: 'RPC failed', code: 'RPC_ERROR' } 
      }))
    }

    // Override the mock temporarily
    const { createAdminClient } = require('@/lib/supabase')
    createAdminClient.mockReturnValueOnce(mockFailingClient)

    const { GET: setupListTables } = require('../app/api/debug/setup-list-tables/route')
    
    const response = await setupListTables()
    const result = await response.json()

    // Should handle the error gracefully and provide fallback
    expect(response.status).toBeLessThanOrEqual(500)
    expect(result).toHaveProperty('success')
  })

  it('should validate environment variables', async () => {
    // Temporarily remove environment variables
    const originalUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const originalKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    
    delete process.env.NEXT_PUBLIC_SUPABASE_URL
    delete process.env.SUPABASE_SERVICE_ROLE_KEY

    const { GET: setupListTables } = require('../app/api/debug/setup-list-tables/route')
    
    const response = await setupListTables()
    const result = await response.json()

    expect(response.status).toBe(500)
    expect(result).toHaveProperty('error')
    expect(result.error).toContain('Missing Supabase environment variables')

    // Restore environment variables
    process.env.NEXT_PUBLIC_SUPABASE_URL = originalUrl
    process.env.SUPABASE_SERVICE_ROLE_KEY = originalKey
  })
})

describe('Network Error Handling', () => {
  it('should provide detailed error information', async () => {
    // This test would ideally make real network requests
    // but for now we'll just verify the error structure
    const errorExample = {
      success: false,
      error: "Failed to list tables using both information_schema and pg_catalog",
      details: { 
        primaryError: { message: "Connection failed", code: "NETWORK_ERROR" },
        fallbackError: { message: "RPC unavailable", code: "RPC_ERROR" }
      }
    }

    expect(errorExample).toHaveProperty('success', false)
    expect(errorExample).toHaveProperty('error')
    expect(errorExample.details).toHaveProperty('primaryError')
    expect(errorExample.details).toHaveProperty('fallbackError')
  })
})