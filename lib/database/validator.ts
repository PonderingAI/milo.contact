/**
 * Database Schema Validation and Migration System
 */

import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { tableConfigs, TableConfig, getAllTables, getTableDependencies } from "./schema"

export interface TableStatus {
  name: string
  exists: boolean
  hasAllColumns: boolean
  missingColumns: string[]
  extraColumns: string[]
  hasCorrectIndexes: boolean
  missingIndexes: string[]
  hasCorrectPolicies: boolean
  missingPolicies: string[]
  needsUpdate: boolean
}

export interface DatabaseStatus {
  version: number
  allTablesExist: boolean
  tablesNeedingUpdate: string[]
  missingTables: string[]
  tableStatuses: Record<string, TableStatus>
  canAutoFix: boolean
  sqlFixScript: string
  updateScript: string
}

export class DatabaseValidator {
  private supabase = createClientComponentClient()

  /**
   * Check the status of all tables in the database
   */
  async validateDatabase(): Promise<DatabaseStatus> {
    const tables = getAllTables()
    const tableStatuses: Record<string, TableStatus> = {}
    const missingTables: string[] = []
    const tablesNeedingUpdate: string[] = []

    for (const table of tables) {
      const status = await this.validateTable(table)
      tableStatuses[table.name] = status
      
      if (!status.exists) {
        missingTables.push(table.name)
      } else if (status.needsUpdate) {
        tablesNeedingUpdate.push(table.name)
      }
    }

    const allTablesExist = missingTables.length === 0
    const canAutoFix = true // We can always generate SQL scripts
    
    const sqlFixScript = this.generateCreationScript(missingTables)
    const updateScript = this.generateUpdateScript(tablesNeedingUpdate, tableStatuses)

    return {
      version: 1,
      allTablesExist,
      tablesNeedingUpdate,
      missingTables,
      tableStatuses,
      canAutoFix,
      sqlFixScript,
      updateScript
    }
  }

  /**
   * Validate a single table
   */
  async validateTable(table: TableConfig): Promise<TableStatus> {
    const name = table.name
    let exists = false
    let hasAllColumns = false
    let missingColumns: string[] = []
    let extraColumns: string[] = []
    let hasCorrectIndexes = false
    let missingIndexes: string[] = []
    let hasCorrectPolicies = false
    let missingPolicies: string[] = []

    try {
      // Check if table exists
      exists = await this.checkTableExists(name)
      
      if (exists) {
        // Check columns
        const columnCheck = await this.checkTableColumns(table)
        hasAllColumns = columnCheck.hasAllColumns
        missingColumns = columnCheck.missingColumns
        extraColumns = columnCheck.extraColumns

        // Check indexes (simplified check)
        hasCorrectIndexes = await this.checkTableIndexes(table)
        if (!hasCorrectIndexes && table.indexes) {
          missingIndexes = table.indexes
        }

        // Check policies (simplified check)
        hasCorrectPolicies = await this.checkTablePolicies(table)
        if (!hasCorrectPolicies && table.policies) {
          missingPolicies = table.policies
        }
      }
    } catch (error) {
      console.warn(`Error validating table ${name}:`, error)
    }

    const needsUpdate = exists && (!hasAllColumns || !hasCorrectIndexes || !hasCorrectPolicies)

    return {
      name,
      exists,
      hasAllColumns,
      missingColumns,
      extraColumns,
      hasCorrectIndexes,
      missingIndexes,
      hasCorrectPolicies,
      missingPolicies,
      needsUpdate
    }
  }

  /**
   * Check if a table exists
   */
  async checkTableExists(tableName: string): Promise<boolean> {
    try {
      const { error } = await this.supabase.from(tableName).select("*").limit(1)
      return !error || (error.code !== "PGRST116" && !error.message.includes("does not exist"))
    } catch {
      return false
    }
  }

  /**
   * Check table columns
   */
  async checkTableColumns(table: TableConfig): Promise<{
    hasAllColumns: boolean
    missingColumns: string[]
    extraColumns: string[]
  }> {
    if (!table.columns) {
      return { hasAllColumns: true, missingColumns: [], extraColumns: [] }
    }

    try {
      // Query information_schema to get column information
      const { data: columns, error } = await this.supabase
        .from("information_schema.columns")
        .select("column_name, data_type, is_nullable, column_default")
        .eq("table_schema", "public")
        .eq("table_name", table.name)

      if (error) {
        console.warn(`Error checking columns for ${table.name}:`, error)
        return { hasAllColumns: false, missingColumns: [], extraColumns: [] }
      }

      const existingColumns = new Set(columns?.map(col => col.column_name) || [])
      const expectedColumns = new Set(table.columns.map(col => col.name))

      const missingColumns = table.columns
        .filter(col => !existingColumns.has(col.name))
        .map(col => col.name)

      const extraColumns = (columns || [])
        .filter(col => !expectedColumns.has(col.column_name))
        .map(col => col.column_name)

      return {
        hasAllColumns: missingColumns.length === 0,
        missingColumns,
        extraColumns
      }
    } catch (error) {
      console.warn(`Error checking columns for ${table.name}:`, error)
      return { hasAllColumns: false, missingColumns: [], extraColumns: [] }
    }
  }

  /**
   * Check table indexes (simplified)
   */
  async checkTableIndexes(table: TableConfig): Promise<boolean> {
    // For now, we'll assume indexes are correct if the table exists
    // A more sophisticated implementation would query pg_indexes
    return true
  }

  /**
   * Check table policies (simplified)
   */
  async checkTablePolicies(table: TableConfig): Promise<boolean> {
    // For now, we'll assume policies are correct if the table exists
    // A more sophisticated implementation would query pg_policies
    return true
  }

  /**
   * Generate SQL script to create missing tables
   */
  generateCreationScript(missingTableNames: string[]): string {
    if (missingTableNames.length === 0) {
      return ""
    }

    let sql = `-- Database Creation Script\n-- Generated on ${new Date().toISOString()}\n\n`
    sql += `-- Enable UUID extension if not already enabled\nCREATE EXTENSION IF NOT EXISTS "uuid-ossp";\n\n`

    // Sort tables by dependencies
    const sortedTables = this.sortTablesByDependencies(missingTableNames)

    for (const tableName of sortedTables) {
      const table = tableConfigs[tableName]
      if (table) {
        sql += `-- Setup for ${table.displayName}\n`
        sql += table.sql
        sql += "\n\n"
      }
    }

    return sql.trim()
  }

  /**
   * Generate SQL script to update existing tables
   */
  generateUpdateScript(tableNames: string[], tableStatuses: Record<string, TableStatus>): string {
    if (tableNames.length === 0) {
      return ""
    }

    let sql = `-- Database Update Script\n-- Generated on ${new Date().toISOString()}\n\n`

    for (const tableName of tableNames) {
      const table = tableConfigs[tableName]
      const status = tableStatuses[tableName]
      
      if (!table || !status) continue

      sql += `-- Updates for ${table.displayName}\n`

      // Add missing columns
      if (status.missingColumns.length > 0 && table.columns) {
        for (const columnName of status.missingColumns) {
          const column = table.columns.find(c => c.name === columnName)
          if (column) {
            sql += `-- Add missing column: ${columnName}\n`
            sql += `DO $$\nBEGIN\n`
            sql += `  IF NOT EXISTS (\n`
            sql += `    SELECT 1 FROM information_schema.columns \n`
            sql += `    WHERE table_name = '${tableName}' AND column_name = '${columnName}'\n`
            sql += `  ) THEN\n`
            
            let alterSql = `    ALTER TABLE ${tableName} ADD COLUMN ${columnName} ${column.type}`
            
            if (column.constraints) {
              for (const constraint of column.constraints) {
                if (constraint !== "PRIMARY KEY") { // Skip primary key in ALTER
                  alterSql += ` ${constraint}`
                }
              }
            }
            
            if (column.default) {
              alterSql += ` DEFAULT ${column.default}`
            }
            
            sql += `${alterSql};\n`
            sql += `  END IF;\n`
            sql += `END $$;\n\n`
          }
        }
      }

      // Add missing indexes
      if (status.missingIndexes.length > 0) {
        for (const index of status.missingIndexes) {
          sql += `-- Add missing index\n`
          sql += `CREATE INDEX IF NOT EXISTS ${index} ON ${tableName};\n\n`
        }
      }

      // Note about missing policies
      if (status.missingPolicies.length > 0) {
        sql += `-- Note: Table ${tableName} may be missing Row Level Security policies\n`
        sql += `-- Please review the table definition for policy requirements\n\n`
      }
    }

    return sql.trim()
  }

  /**
   * Sort tables by their dependencies
   */
  private sortTablesByDependencies(tableNames: string[]): string[] {
    const sorted: string[] = []
    const visited = new Set<string>()
    const visiting = new Set<string>()

    const visit = (tableName: string) => {
      if (visiting.has(tableName)) {
        throw new Error(`Circular dependency detected involving table: ${tableName}`)
      }
      
      if (visited.has(tableName)) {
        return
      }

      visiting.add(tableName)
      
      const table = tableConfigs[tableName]
      if (table) {
        // Visit dependencies first
        for (const dep of table.dependencies) {
          if (tableNames.includes(dep)) {
            visit(dep)
          }
        }
      }

      visiting.delete(tableName)
      visited.add(tableName)
      sorted.push(tableName)
    }

    for (const tableName of tableNames) {
      if (!visited.has(tableName)) {
        visit(tableName)
      }
    }

    return sorted
  }

  /**
   * Execute SQL script
   */
  async executeSQL(sql: string): Promise<{ success: boolean; error?: string }> {
    try {
      const response = await fetch("/api/execute-sql", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ sql }),
      })

      const result = await response.json()

      if (!response.ok) {
        return { success: false, error: result.error || "Failed to execute SQL" }
      }

      return { success: true }
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : "Unknown error occurred" 
      }
    }
  }
}

/**
 * Global instance
 */
export const databaseValidator = new DatabaseValidator()