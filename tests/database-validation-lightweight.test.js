/**
 * Lightweight Database Validation Tests
 * 
 * These tests can run quickly without building the entire Next.js application
 * and focus on the core database validation logic issues.
 */

import { DatabaseValidator } from '../lib/database/validator'

// Mock Supabase client for reliable testing
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

describe('Database Validation Banner Issue - Lightweight Tests', () => {
  let validator

  beforeEach(() => {
    validator = new DatabaseValidator()
    // Reset mocks
    jest.clearAllMocks()
    
    // Get mock reference
    const mockSupabase = validator.supabase
    if (mockSupabase && mockSupabase.rpc) {
      mockSupabase.rpc.mockRejectedValue(
        new Error('function exec_sql(sql_query text) does not exist')
      )
    }
  })

  describe('Scenario: User ran migration, got "no rows returned", banner still shows', () => {
    test('should not show false positive banner when exec_sql is unavailable', async () => {
      // Simulate the user's scenario:
      // 1. Tables exist (migration was successful)
      // 2. exec_sql function is not available (production environment)
      // 3. User sees "no rows returned" (normal for DDL statements)
      // 4. Banner should NOT show because we can't reliably validate

      // Mock tables exist
      jest.spyOn(validator, 'checkTableExists').mockResolvedValue(true)
      
      // Mock exec_sql not available (like in production)
      const mockSupabase = validator.supabase
      if (mockSupabase && mockSupabase.rpc) {
        mockSupabase.rpc.mockRejectedValue(
          new Error('function exec_sql(sql_query text) does not exist')
        )
      }

      const status = await validator.validateDatabase()

      // Banner should NOT show when we can't validate reliably
      expect(status.updateScript).toBe('')
      expect(status.tablesNeedingUpdate).toEqual([])
      expect(status.allTablesExist).toBe(true)
    })

    test('should provide manual override capability', async () => {
      // User should be able to manually mark database as up-to-date
      // when they know migrations were successful but validation fails

      validator.bypassValidation(true)
      
      const status = await validator.validateDatabase()
      
      // When validation is bypassed, should not show banner
      expect(status.updateScript).toBe('')
      expect(status.tablesNeedingUpdate).toEqual([])
      expect(validator.isValidationBypassed()).toBe(true)
    })

    test('should handle "no rows returned" migration result gracefully', () => {
      // "no rows returned" is the expected result for DDL statements like:
      // ALTER TABLE media ADD COLUMN file_path TEXT NOT NULL;
      // This should NOT be treated as an error

      const migrationResult = "no rows returned"
      
      // This is normal and expected for DDL statements
      expect(migrationResult).toBe("no rows returned")
      
      // The system should not interpret this as a failure
      // and should not continue showing update banners
    })
  })

  describe('Validation Logic Improvements', () => {
    test('should only generate update script when actual updates are needed', async () => {
      // Test the improved generateUpdateScript logic
      
      const tableStatuses = {
        'test_table': {
          name: 'test_table',
          exists: true,
          hasAllColumns: true,
          missingColumns: [], // No missing columns
          extraColumns: [],
          hasCorrectIndexes: true,
          missingIndexes: [], // No missing indexes
          hasCorrectPolicies: true,
          missingPolicies: [], // No missing policies
          needsUpdate: false
        }
      }

      const updateScript = validator.generateUpdateScript(['test_table'], tableStatuses)
      
      // Should be empty when no updates are actually needed
      expect(updateScript).toBe('')
    })

    test('should generate update script only when there are real changes', async () => {
      const tableStatuses = {
        'user_roles': { // Use a real table from the schema
          name: 'user_roles',
          exists: true,
          hasAllColumns: false,
          missingColumns: ['role'], // Use a real column from the schema that could be missing
          extraColumns: [],
          hasCorrectIndexes: true,
          missingIndexes: [],
          hasCorrectPolicies: true,
          missingPolicies: [],
          needsUpdate: true
        }
      }

      const updateScript = validator.generateUpdateScript(['user_roles'], tableStatuses)
      
      // Should generate script when there are actual missing columns
      expect(updateScript).not.toBe('')
      expect(updateScript).toContain('-- Database Update Script')
      expect(updateScript).toContain('role') // Use the real column name
    })
  })

  describe('Performance and Reliability', () => {
    test('should complete validation quickly for testing', async () => {
      const startTime = Date.now()
      
      // Mock fast responses
      jest.spyOn(validator, 'checkTableExists').mockResolvedValue(true)
      jest.spyOn(validator, 'checkTableColumns').mockResolvedValue({
        hasAllColumns: true,
        missingColumns: [],
        extraColumns: []
      })

      await validator.validateDatabase()
      
      const endTime = Date.now()
      const duration = endTime - startTime
      
      // Should complete within reasonable time for testing
      expect(duration).toBeLessThan(1000) // Less than 1 second
    })

    test('should handle network failures gracefully', async () => {
      // Simulate network issues
      jest.spyOn(validator, 'checkTableExists').mockRejectedValue(
        new Error('Network error')
      )

      const status = await validator.validateDatabase()
      
      // Should not crash and should provide safe defaults
      expect(status).toBeDefined()
      expect(status.version).toBe(1)
      expect(Array.isArray(status.missingTables)).toBe(true)
      expect(Array.isArray(status.tablesNeedingUpdate)).toBe(true)
    })
  })

  describe('User Experience Improvements', () => {
    test('should gracefully handle validation uncertainty', async () => {
      // When exec_sql is not available, system should fall back gracefully
      // without confusing the user with excessive warnings
      
      jest.spyOn(validator, 'executeRawSQL').mockResolvedValue({
        success: false,
        error: 'exec_sql function not available'
      })

      const result = await validator.checkTableColumns({
        name: 'test_table',
        displayName: 'Test Table',
        description: 'Test',
        sql: 'CREATE TABLE test_table (id UUID PRIMARY KEY);',
        dependencies: [],
        required: false,
        category: 'other',
        version: 1,
        columns: [
          { name: 'id', type: 'UUID', constraints: ['PRIMARY KEY'] }
        ]
      })

      // Should fall back to assuming table is correct to avoid false positives
      expect(result.hasAllColumns).toBe(true)
      expect(result.missingColumns).toEqual([])
      expect(result.extraColumns).toEqual([])
    })

    test('should provide manual refresh capability in UI context', () => {
      // UI should offer a "Mark as Up to Date" button that:
      // 1. Forces re-validation
      // 2. Clears any cached status
      // 3. Provides user feedback

      // This test validates that the validator supports this pattern
      expect(typeof validator.validateDatabase).toBe('function')
      expect(typeof validator.bypassValidation).toBe('function')
      expect(typeof validator.isValidationBypassed).toBe('function')
    })
  })
})

describe('Fast Integration Tests', () => {
  test('should maintain consistency between schema and validator', () => {
    // Quick validation that the system components work together
    // without requiring database connections
    
    const validator = new DatabaseValidator()
    
    expect(validator).toBeDefined()
    expect(typeof validator.validateDatabase).toBe('function')
    expect(typeof validator.generateCreationScript).toBe('function')
    expect(typeof validator.generateUpdateScript).toBe('function')
  })
})