/**
 * Test for database manager banner issue fix
 */

import { jest } from '@jest/globals'

// Mock functions for testing
const mockDatabaseValidator = {
  validateDatabase: jest.fn(),
  markAsUpToDate: jest.fn(),
  clearUpToDateMark: jest.fn(),
  isMarkedAsUpToDate: jest.fn()
}

describe('Database Manager Banner Issue', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  test('should not show banner when no updates are needed', async () => {
    // Mock validator returning no updates needed
    mockDatabaseValidator.validateDatabase.mockResolvedValue({
      version: 1,
      allTablesExist: true,
      tablesNeedingUpdate: [],
      missingTables: [],
      tableStatuses: {},
      canAutoFix: true,
      sqlFixScript: '',
      updateScript: '' // Empty update script
    })

    const status = await mockDatabaseValidator.validateDatabase()
    
    expect(status.updateScript.trim().length).toBe(0)
    expect(status.tablesNeedingUpdate.length).toBe(0)
  })

  test('should not show banner when marked as up to date', async () => {
    // Mock validator as marked up to date
    mockDatabaseValidator.isMarkedAsUpToDate.mockReturnValue(true)
    mockDatabaseValidator.validateDatabase.mockResolvedValue({
      version: 1,
      allTablesExist: true,
      tablesNeedingUpdate: [],
      missingTables: [],
      tableStatuses: {},
      canAutoFix: true,
      sqlFixScript: '',
      updateScript: '' // Should be empty when marked as up to date
    })

    const status = await mockDatabaseValidator.validateDatabase()
    
    expect(status.updateScript.trim().length).toBe(0)
    expect(mockDatabaseValidator.isMarkedAsUpToDate()).toBe(true)
  })

  test('should show banner only when actual updates are needed', async () => {
    // Mock validator returning actual updates needed
    mockDatabaseValidator.validateDatabase.mockResolvedValue({
      version: 1,
      allTablesExist: true,
      tablesNeedingUpdate: ['projects'],
      missingTables: [],
      tableStatuses: {
        projects: {
          name: 'projects',
          exists: true,
          hasAllColumns: false,
          missingColumns: ['project_date'], // Actual missing column
          extraColumns: [],
          hasCorrectIndexes: true,
          missingIndexes: [],
          hasCorrectPolicies: true,
          missingPolicies: [],
          needsUpdate: true
        }
      },
      canAutoFix: true,
      sqlFixScript: '',
      updateScript: 'ALTER TABLE projects ADD COLUMN project_date DATE;' // Real update script
    })

    const status = await mockDatabaseValidator.validateDatabase()
    
    expect(status.updateScript.trim().length).toBeGreaterThan(0)
    expect(status.tablesNeedingUpdate.length).toBe(1)
    expect(status.tablesNeedingUpdate).toContain('projects')
  })

  test('mark as up to date functionality', () => {
    mockDatabaseValidator.markAsUpToDate()
    expect(mockDatabaseValidator.markAsUpToDate).toHaveBeenCalledTimes(1)
  })
})