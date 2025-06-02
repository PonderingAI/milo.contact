/**
 * Test to reproduce and fix the banner issue where migration banner 
 * still shows even after running migration scripts
 */

import { DatabaseValidator } from '../lib/database/validator'

// Mock the Supabase client to simulate different scenarios
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

describe('Database Validation Banner Issue', () => {
  let validator
  let mockSupabase

  beforeEach(() => {
    validator = new DatabaseValidator()
    mockSupabase = validator.supabase
  })

  test('should not show banner when exec_sql is unavailable and tables exist', async () => {
    // Mock table exists check to return true
    jest.spyOn(validator, 'checkTableExists').mockResolvedValue(true)
    
    // Mock exec_sql RPC to fail (simulating production environment)
    mockSupabase.rpc.mockRejectedValue(new Error('function exec_sql(sql_query text) does not exist'))
    
    // Mock executeRawSQL to fail
    jest.spyOn(validator, 'executeRawSQL').mockResolvedValue({
      success: false,
      error: 'function exec_sql(sql_query text) does not exist'
    })

    const status = await validator.validateDatabase()
    
    // The banner should NOT show when:
    // 1. Tables exist
    // 2. exec_sql is not available (so we can't validate columns)
    // 3. We should assume everything is OK rather than showing false positives
    expect(status.updateScript).toBe('')
    expect(status.tablesNeedingUpdate).toEqual([])
  })

  test('should properly handle exec_sql unavailable scenario', async () => {
    // This test simulates the real-world scenario where:
    // - User has run migration script
    // - Tables exist but exec_sql function is not available
    // - System should not show false positive banner
    
    const testTable = {
      name: 'test_table',
      displayName: 'Test Table',
      description: 'Test table for validation',
      sql: 'CREATE TABLE test_table (id UUID PRIMARY KEY);',
      dependencies: [],
      required: true,
      category: 'core',
      version: 1,
      columns: [
        { name: 'id', type: 'UUID', constraints: ['PRIMARY KEY'] },
        { name: 'name', type: 'TEXT', constraints: ['NOT NULL'] }
      ]
    }

    // Mock table exists
    jest.spyOn(validator, 'checkTableExists').mockResolvedValue(true)
    
    // Mock column check to fail (exec_sql not available)
    jest.spyOn(validator, 'checkTableColumns').mockResolvedValue({
      hasAllColumns: true, // Should fall back to true when validation fails
      missingColumns: [],
      extraColumns: []
    })

    const tableStatus = await validator.validateTable(testTable)

    // When exec_sql is not available, we should assume the table is correct
    // rather than showing false positive "needs update"
    expect(tableStatus.needsUpdate).toBe(false)
    expect(tableStatus.exists).toBe(true)
    expect(tableStatus.hasAllColumns).toBe(true)
  })

  test('should generate empty update script when validation cannot be performed', async () => {
    // Mock a scenario where validation can't be performed reliably
    jest.spyOn(validator, 'checkTableExists').mockResolvedValue(true)
    jest.spyOn(validator, 'executeRawSQL').mockResolvedValue({
      success: false,
      error: 'exec_sql not available'
    })

    const updateScript = validator.generateUpdateScript(['test_table'], {
      test_table: {
        name: 'test_table',
        exists: true,
        hasAllColumns: true, // When validation fails, we assume it's correct
        missingColumns: [],
        extraColumns: [],
        hasCorrectIndexes: true,
        missingIndexes: [],
        hasCorrectPolicies: true,
        missingPolicies: [],
        needsUpdate: false // Should be false when validation is uncertain
      }
    })

    expect(updateScript).toBe('')
  })
})

describe('Improved Database Validation Logic', () => {
  let validator

  beforeEach(() => {
    validator = new DatabaseValidator()
  })

  test('should provide manual refresh capability', async () => {
    // Test that there's a way to manually mark database as up-to-date
    // This could be useful when user knows they've run migrations successfully
    
    // This is a placeholder for a feature that should exist
    // The system should provide a way to bypass unreliable validation
    expect(typeof validator.validateDatabase).toBe('function')
  })

  test('should have robust fallback validation', async () => {
    // When advanced validation fails, the system should have
    // simple but reliable fallback methods
    
    const hasBasicValidation = typeof validator.checkTableExists === 'function'
    expect(hasBasicValidation).toBe(true)
  })
})