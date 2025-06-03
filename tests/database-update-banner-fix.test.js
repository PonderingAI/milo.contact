/**
 * Test to verify the fix for persistent update schema messages
 * when exec_sql is unavailable but schema is actually up to date
 */

import { DatabaseValidator } from '../lib/database/validator'

// Mock the Supabase client 
jest.mock('@supabase/auth-helpers-nextjs', () => ({
  createClientComponentClient: () => ({
    from: jest.fn().mockReturnValue({
      select: jest.fn().mockReturnValue({
        limit: jest.fn().mockResolvedValue({ data: [], error: null })
      })
    }),
    rpc: jest.fn()
  })
}))

describe('Database Update Banner Fix', () => {
  let validator
  let mockSupabase

  beforeEach(() => {
    validator = new DatabaseValidator()
    mockSupabase = validator.supabase
  })

  test('should not generate update script when exec_sql fails and tables exist', async () => {
    // Mock all tables as existing
    jest.spyOn(validator, 'checkTableExists').mockResolvedValue(true)
    
    // Mock exec_sql to fail (simulating production environment without exec_sql function)
    mockSupabase.rpc.mockRejectedValue(new Error('function exec_sql(sql_query text) does not exist'))
    
    const status = await validator.validateDatabase()
    
    // When exec_sql is unavailable:
    // 1. Tables exist, so we shouldn't see them as missing
    // 2. Column validation should fall back to "assume correct"
    // 3. No update script should be generated
    // 4. No tables should be marked as needing updates
    expect(status.missingTables).toEqual([])
    expect(status.tablesNeedingUpdate).toEqual([])
    expect(status.updateScript).toBe('')
    expect(status.allTablesExist).toBe(true)
  })

  test('should provide persistent bypass for update notifications', async () => {
    // Test that validation bypass persists properly
    validator.bypassValidation(true)
    
    const status = await validator.validateDatabase()
    
    // When validation is bypassed, everything should be marked as correct
    expect(status.updateScript).toBe('')
    expect(status.tablesNeedingUpdate).toEqual([])
    expect(validator.isValidationBypassed()).toBe(true)
  })

  test('should handle mixed scenarios gracefully', async () => {
    // Some tables exist, some don't, but detailed validation fails
    const tableExistsMap = {
      'user_roles': true,
      'projects': true,
      'media': false, // This one is actually missing
      'site_settings': true
    }
    
    jest.spyOn(validator, 'checkTableExists').mockImplementation(
      (tableName) => Promise.resolve(tableExistsMap[tableName] || false)
    )
    
    // Mock exec_sql to fail
    mockSupabase.rpc.mockRejectedValue(new Error('exec_sql unavailable'))
    
    const status = await validator.validateDatabase()
    
    // Should correctly identify missing tables but not flag existing ones for updates
    expect(status.missingTables).toContain('media')
    expect(status.missingTables).not.toContain('user_roles')
    expect(status.missingTables).not.toContain('projects')
    expect(status.missingTables).not.toContain('site_settings')
    
    // Existing tables should not be marked as needing updates when validation is uncertain
    expect(status.tablesNeedingUpdate).not.toContain('user_roles')
    expect(status.tablesNeedingUpdate).not.toContain('projects')
    expect(status.tablesNeedingUpdate).not.toContain('site_settings')
  })

  test('should respect markAsUpToDate setting and bypass validation', async () => {
    // Mock tables as existing but simulate exec_sql failure
    jest.spyOn(validator, 'checkTableExists').mockResolvedValue(true)
    mockSupabase.rpc.mockRejectedValue(new Error('exec_sql unavailable'))
    
    // First, verify we might see issues without marking as up to date
    let status = await validator.validateDatabase()
    
    // Now mark as up to date
    validator.markAsUpToDate()
    
    // Validate again - should now bypass detailed validation
    status = await validator.validateDatabase()
    
    // Should not show any update requirements
    expect(status.updateScript).toBe('')
    expect(status.tablesNeedingUpdate).toEqual([])
  })

  test('markAsUpToDate should expire after time period', () => {
    // Mock localStorage
    const mockLocalStorage = {
      getItem: jest.fn(),
      setItem: jest.fn()
    }
    Object.defineProperty(window, 'localStorage', {
      value: mockLocalStorage
    })
    
    // Mark as up to date
    validator.markAsUpToDate()
    expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
      'database_marked_up_to_date',
      expect.any(String)
    )
    
    // Simulate an old timestamp (more than 1 hour ago)
    const oldTimestamp = Date.now() - (2 * 60 * 60 * 1000) // 2 hours ago
    mockLocalStorage.getItem.mockReturnValue(oldTimestamp.toString())
    
    // Should not be marked as up to date anymore
    expect(validator.isValidationBypassed()).toBe(false)
  })
})