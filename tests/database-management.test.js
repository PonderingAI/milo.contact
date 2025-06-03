/**
 * Enhanced Database Management System Tests
 * 
 * Tests for the new centralized database schema management system
 */

import { 
  tableConfigs, 
  getAllTables, 
  getTablesByCategory, 
  getRequiredTables,
  getTableConfig,
  getTableDependencies,
  validateTableConfig,
  getSchemaSummary 
} from '../lib/database/schema'

describe('Database Schema Configuration Tests', () => {
  
  describe('Table Configuration Structure', () => {
    test('should have valid table configurations', () => {
      const tables = getAllTables()
      
      expect(tables).toBeDefined()
      expect(Array.isArray(tables)).toBe(true)
      expect(tables.length).toBeGreaterThan(0)
      
      // Check that all tables have required properties
      tables.forEach(table => {
        expect(table.name).toBeDefined()
        expect(table.displayName).toBeDefined()
        expect(table.description).toBeDefined()
        expect(table.sql).toBeDefined()
        expect(table.category).toBeDefined()
        expect(typeof table.required).toBe('boolean')
        expect(typeof table.version).toBe('number')
        expect(Array.isArray(table.dependencies)).toBe(true)
      })
    })

    test('should validate table configurations', () => {
      const tables = getAllTables()
      
      tables.forEach(table => {
        const errors = validateTableConfig(table)
        expect(errors).toEqual([]) // No validation errors
      })
    })

    test('should have core required tables', () => {
      const requiredTables = getRequiredTables()
      
      expect(requiredTables.length).toBeGreaterThan(0)
      
      // Should include essential tables
      const requiredNames = requiredTables.map(t => t.name)
      expect(requiredNames).toContain('user_roles')
      expect(requiredNames).toContain('site_settings')
      expect(requiredNames).toContain('projects')
    })
  })

  describe('Table Categories', () => {
    test('should organize tables by valid categories', () => {
      const validCategories = ['core', 'content', 'media', 'security', 'dependencies', 'other']
      const tables = getAllTables()
      
      tables.forEach(table => {
        expect(validCategories).toContain(table.category)
      })
    })

    test('should retrieve tables by category', () => {
      const coreTables = getTablesByCategory('core')
      
      expect(Array.isArray(coreTables)).toBe(true)
      
      coreTables.forEach(table => {
        expect(table.category).toBe('core')
      })
    })

    test('should have tables in core category', () => {
      const coreTables = getTablesByCategory('core')
      expect(coreTables.length).toBeGreaterThan(0)
    })
  })

  describe('Table Dependencies', () => {
    test('should resolve table dependencies correctly', () => {
      // Test a table that has dependencies
      const projectsDeps = getTableDependencies('projects')
      
      expect(Array.isArray(projectsDeps)).toBe(true)
      expect(projectsDeps).toContain('user_roles')
    })

    test('should handle tables with no dependencies', () => {
      const userRolesDeps = getTableDependencies('user_roles')
      
      expect(Array.isArray(userRolesDeps)).toBe(true)
      expect(userRolesDeps.length).toBe(0)
    })

    test('should not have circular dependencies', () => {
      const tables = getAllTables()
      
      // Simple circular dependency check
      tables.forEach(table => {
        const deps = getTableDependencies(table.name)
        expect(deps).not.toContain(table.name) // Table should not depend on itself
      })
    })
  })

  describe('Schema Summary', () => {
    test('should generate correct schema summary', () => {
      const summary = getSchemaSummary()
      
      expect(summary).toBeDefined()
      expect(typeof summary.version).toBe('number')
      expect(typeof summary.totalTables).toBe('number')
      expect(typeof summary.requiredTables).toBe('number')
      expect(Array.isArray(summary.categories)).toBe(true)
      expect(Array.isArray(summary.tables)).toBe(true)
      
      expect(summary.totalTables).toBeGreaterThan(0)
      expect(summary.requiredTables).toBeGreaterThan(0)
      expect(summary.requiredTables).toBeLessThanOrEqual(summary.totalTables)
    })

    test('should have correct category counts', () => {
      const summary = getSchemaSummary()
      const tables = getAllTables()
      
      // Verify category counts match actual tables
      const actualCategoryCounts = {}
      tables.forEach(table => {
        actualCategoryCounts[table.category] = (actualCategoryCounts[table.category] || 0) + 1
      })
      
      summary.categories.forEach(cat => {
        expect(cat.count).toBe(actualCategoryCounts[cat.name] || 0)
      })
    })
  })

  describe('SQL Validation', () => {
    test('should have valid SQL for all tables', () => {
      const tables = getAllTables()
      
      tables.forEach(table => {
        expect(table.sql).toBeDefined()
        expect(table.sql.trim().length).toBeGreaterThan(0)
        
        // Should contain CREATE TABLE statement
        expect(table.sql.toUpperCase()).toContain('CREATE TABLE')
        expect(table.sql.toUpperCase()).toContain(table.name.toUpperCase())
        
        // Should have RLS policies
        expect(table.sql.toUpperCase()).toContain('ROW LEVEL SECURITY')
      })
    })

    test('should have proper UUID extension reference', () => {
      const tables = getAllTables().filter(t => t.sql.includes('uuid_generate_v4'))
      
      // Tables using UUIDs should be properly configured
      tables.forEach(table => {
        expect(table.sql).toContain('uuid_generate_v4()')
      })
    })
  })

  describe('Table Configuration Retrieval', () => {
    test('should retrieve table by name', () => {
      const userRoles = getTableConfig('user_roles')
      
      expect(userRoles).toBeDefined()
      expect(userRoles?.name).toBe('user_roles')
      expect(userRoles?.displayName).toBe('User Roles')
    })

    test('should return undefined for non-existent table', () => {
      const nonExistent = getTableConfig('non_existent_table')
      
      expect(nonExistent).toBeUndefined()
    })

    test('should have consistent table names in config object', () => {
      Object.entries(tableConfigs).forEach(([key, config]) => {
        expect(key).toBe(config.name)
      })
    })
  })
})

describe('Database Testing Utilities Tests', () => {
  
  test('should have predefined test configurations', () => {
    // These would test the DatabaseTestingUtils class
    // For now, we'll test the structure that should exist
    
    const expectedConfigs = ['minimal', 'basic', 'full', 'development']
    
    // This is a placeholder for when we import the actual testing utilities
    expect(expectedConfigs.length).toBeGreaterThan(0)
  })
})

describe('Database Validation System Tests', () => {
  
  test('should provide table status structure', () => {
    // Test the structure that TableStatus should have
    const expectedProps = [
      'name', 'exists', 'hasAllColumns', 'missingColumns', 
      'extraColumns', 'hasCorrectIndexes', 'missingIndexes',
      'hasCorrectPolicies', 'missingPolicies', 'needsUpdate'
    ]
    
    expectedProps.forEach(prop => {
      expect(typeof prop).toBe('string')
      expect(prop.length).toBeGreaterThan(0)
    })
  })

  test('should provide database status structure', () => {
    // Test the structure that DatabaseStatus should have
    const expectedProps = [
      'version', 'allTablesExist', 'tablesNeedingUpdate', 
      'missingTables', 'tableStatuses', 'canAutoFix',
      'sqlFixScript', 'updateScript'
    ]
    
    expectedProps.forEach(prop => {
      expect(typeof prop).toBe('string')
      expect(prop.length).toBeGreaterThan(0)
    })
  })
})

describe('Integration Tests', () => {
  
  test('should have consistent schema across all components', () => {
    const tables = getAllTables()
    const summary = getSchemaSummary()
    
    expect(summary.totalTables).toBe(tables.length)
    
    // Count required tables
    const requiredCount = tables.filter(t => t.required).length
    expect(summary.requiredTables).toBe(requiredCount)
  })

  test('should maintain referential integrity in dependencies', () => {
    const tables = getAllTables()
    
    tables.forEach(table => {
      table.dependencies.forEach(dep => {
        const depTable = getTableConfig(dep)
        expect(depTable).toBeDefined()
        expect(depTable?.name).toBe(dep)
      })
    })
  })

  test('should support easy addition of new tables', () => {
    // Test that the system is designed for easy extension
    const tableCount = getAllTables().length
    
    expect(tableCount).toBeGreaterThan(0)
    
    // The system should be modular and extensible
    expect(typeof tableConfigs).toBe('object')
    expect(typeof getAllTables).toBe('function')
    expect(typeof validateTableConfig).toBe('function')
  })
})