/**
 * Database Testing Utilities
 * 
 * This module provides utilities for creating and managing test databases.
 * It allows developers to easily recreate databases for testing purposes.
 */

import { getAllTables, getRequiredTables, TableConfig } from "./schema"
import { DatabaseValidator } from "./validator"

export interface TestDatabaseConfig {
  name: string
  description: string
  tables: string[]
  seedData?: Record<string, any[]>
  cleanupAfter?: boolean
}

export interface TestDatabaseResult {
  success: boolean
  tablesCreated: string[]
  seedDataInserted: number
  error?: string
  cleanupSQL?: string
}

export class DatabaseTestingUtils {
  private validator = new DatabaseValidator()

  /**
   * Predefined test database configurations
   */
  static readonly TEST_CONFIGS: Record<string, TestDatabaseConfig> = {
    minimal: {
      name: "Minimal Test Database",
      description: "Only core tables required for basic functionality",
      tables: ["user_roles", "site_settings"],
      cleanupAfter: true
    },
    
    basic: {
      name: "Basic Test Database", 
      description: "Core tables plus projects for basic testing",
      tables: ["user_roles", "site_settings", "projects"],
      seedData: {
        user_roles: [
          { user_id: "test-admin", role: "admin" },
          { user_id: "test-user", role: "user" }
        ],
        projects: [
          {
            title: "Test Project 1",
            description: "A test project for development",
            is_public: true,
            featured: false
          },
          {
            title: "Test Project 2", 
            description: "Another test project",
            is_public: false,
            featured: true
          }
        ]
      },
      cleanupAfter: true
    },

    full: {
      name: "Full Test Database",
      description: "All available tables for comprehensive testing",
      tables: getAllTables().map(t => t.name),
      cleanupAfter: false
    },

    development: {
      name: "Development Database",
      description: "All tables with development seed data",
      tables: getAllTables().map(t => t.name),
      seedData: {
        user_roles: [
          { user_id: "dev-admin", role: "admin" },
          { user_id: "dev-user", role: "user" }
        ],
        site_settings: [
          { key: "dev_mode", value: "true" },
          { key: "debug_level", value: "verbose" }
        ],
        projects: [
          {
            title: "Development Project",
            description: "Project for development and testing",
            category: "web",
            type: "frontend",
            is_public: true,
            featured: true
          }
        ]
      },
      cleanupAfter: false
    }
  }

  /**
   * Create a test database using a predefined configuration
   */
  async createTestDatabase(configName: string): Promise<TestDatabaseResult> {
    const config = DatabaseTestingUtils.TEST_CONFIGS[configName]
    if (!config) {
      return {
        success: false,
        tablesCreated: [],
        seedDataInserted: 0,
        error: `Test configuration '${configName}' not found`
      }
    }

    return this.createCustomTestDatabase(config)
  }

  /**
   * Create a test database with custom configuration
   */
  async createCustomTestDatabase(config: TestDatabaseConfig): Promise<TestDatabaseResult> {
    try {
      const tablesCreated: string[] = []
      let seedDataInserted = 0

      // Generate creation SQL for the specified tables
      const creationSQL = this.validator.generateCreationScript(config.tables)
      
      if (creationSQL) {
        console.log(`Creating test database: ${config.name}`)
        console.log(`Tables to create: ${config.tables.join(", ")}`)
        
        // Execute the creation SQL
        const createResult = await this.validator.executeSQL(creationSQL)
        
        if (!createResult.success) {
          return {
            success: false,
            tablesCreated: [],
            seedDataInserted: 0,
            error: `Failed to create tables: ${createResult.error}`
          }
        }

        tablesCreated.push(...config.tables)
      }

      // Insert seed data if provided
      if (config.seedData) {
        for (const [tableName, rows] of Object.entries(config.seedData)) {
          if (config.tables.includes(tableName)) {
            const insertResult = await this.insertSeedData(tableName, rows)
            if (insertResult.success) {
              seedDataInserted += rows.length
            } else {
              console.warn(`Failed to insert seed data for ${tableName}:`, insertResult.error)
            }
          }
        }
      }

      // Generate cleanup SQL if requested
      let cleanupSQL: string | undefined
      if (config.cleanupAfter) {
        cleanupSQL = this.generateCleanupSQL(config.tables)
      }

      return {
        success: true,
        tablesCreated,
        seedDataInserted,
        cleanupSQL
      }

    } catch (error) {
      return {
        success: false,
        tablesCreated: [],
        seedDataInserted: 0,
        error: error instanceof Error ? error.message : "Unknown error occurred"
      }
    }
  }

  /**
   * Insert seed data into a table
   */
  async insertSeedData(tableName: string, rows: any[]): Promise<{ success: boolean; error?: string }> {
    if (rows.length === 0) {
      return { success: true }
    }

    try {
      // Build INSERT SQL
      const columns = Object.keys(rows[0])
      const values = rows.map(row => 
        `(${columns.map(col => {
          const value = row[col]
          if (value === null || value === undefined) return "NULL"
          if (typeof value === "string") return `'${value.replace(/'/g, "''")}'`
          if (typeof value === "boolean") return value.toString()
          return value.toString()
        }).join(", ")})`
      ).join(",\n  ")

      const sql = `
INSERT INTO ${tableName} (${columns.join(", ")})
VALUES 
  ${values}
ON CONFLICT DO NOTHING;
      `.trim()

      const result = await this.validator.executeSQL(sql)
      return result

    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error occurred"
      }
    }
  }

  /**
   * Generate cleanup SQL for test tables
   */
  generateCleanupSQL(tableNames: string[]): string {
    let sql = `-- Test Database Cleanup Script\n-- Generated on ${new Date().toISOString()}\n\n`
    
    // Sort tables in reverse dependency order for cleanup
    const sortedTables = [...tableNames].reverse()
    
    for (const tableName of sortedTables) {
      sql += `-- Clean up ${tableName}\n`
      sql += `DELETE FROM ${tableName} WHERE created_at >= NOW() - INTERVAL '1 hour';\n\n`
    }

    return sql.trim()
  }

  /**
   * Recreate the entire database schema
   */
  async recreateDatabase(): Promise<TestDatabaseResult> {
    try {
      console.log("Recreating entire database schema...")
      
      // Get all tables
      const allTables = getAllTables()
      const tableNames = allTables.map(t => t.name)

      // Generate drop script (optional - for clean recreation)
      const dropSQL = tableNames.map(name => `DROP TABLE IF EXISTS ${name} CASCADE;`).join("\n")
      
      // Generate creation script
      const createSQL = this.validator.generateCreationScript(tableNames)

      // Combine scripts
      const fullSQL = `
-- Full Database Recreation Script
-- Generated on ${new Date().toISOString()}

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Drop existing tables (optional)
-- ${dropSQL.split("\n").join("\n-- ")}

-- Create all tables
${createSQL}
      `.trim()

      console.log("Executing database recreation script...")
      const result = await this.validator.executeSQL(fullSQL)

      if (!result.success) {
        return {
          success: false,
          tablesCreated: [],
          seedDataInserted: 0,
          error: `Failed to recreate database: ${result.error}`
        }
      }

      return {
        success: true,
        tablesCreated: tableNames,
        seedDataInserted: 0
      }

    } catch (error) {
      return {
        success: false,
        tablesCreated: [],
        seedDataInserted: 0,
        error: error instanceof Error ? error.message : "Unknown error occurred"
      }
    }
  }

  /**
   * Get available test configurations
   */
  static getAvailableConfigs(): Array<{ name: string; config: TestDatabaseConfig }> {
    return Object.entries(DatabaseTestingUtils.TEST_CONFIGS).map(([name, config]) => ({
      name,
      config
    }))
  }

  /**
   * Validate current database against schema
   */
  async validateTestDatabase() {
    return this.validator.validateDatabase()
  }

  /**
   * Generate a custom test configuration
   */
  static createCustomConfig(
    name: string,
    description: string,
    options: {
      includeTables?: string[]
      excludeTables?: string[]
      includeAllRequired?: boolean
      seedData?: Record<string, any[]>
    } = {}
  ): TestDatabaseConfig {
    let tables: string[]

    if (options.includeTables) {
      tables = options.includeTables
    } else if (options.includeAllRequired) {
      tables = getRequiredTables().map(t => t.name)
    } else {
      tables = getAllTables().map(t => t.name)
    }

    if (options.excludeTables) {
      tables = tables.filter(name => !options.excludeTables!.includes(name))
    }

    return {
      name,
      description,
      tables,
      seedData: options.seedData,
      cleanupAfter: true
    }
  }
}

/**
 * Global instance for testing utilities
 */
export const databaseTesting = new DatabaseTestingUtils()