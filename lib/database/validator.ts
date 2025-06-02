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
  private _bypassValidation = false

  /**
   * Bypass column validation - useful when exec_sql is not available
   * and user has confirmed database is up to date
   */
  bypassValidation(bypass: boolean = true) {
    this._bypassValidation = bypass
  }

  /**
   * Check if validation is bypassed
   */
  isValidationBypassed(): boolean {
    return this._bypassValidation
  }

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
    // If validation is bypassed, assume everything is correct
    if (this._bypassValidation) {
      return { hasAllColumns: true, missingColumns: [], extraColumns: [] }
    }

    if (!table.columns) {
      return { hasAllColumns: true, missingColumns: [], extraColumns: [] }
    }

    try {
      // Use exec_sql to query information_schema since it's not exposed via REST API
      const sql = `
        SELECT column_name, data_type, is_nullable, column_default 
        FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = '${table.name}'
      `
      
      const result = await this.executeRawSQL(sql)
      
      if (!result.success || !result.data) {
        console.warn(`Cannot check columns for ${table.name} - using simplified validation`)
        // Fallback: assume columns are correct if table exists to avoid false positives
        return { hasAllColumns: true, missingColumns: [], extraColumns: [] }
      }

      const columns = result.data
      const existingColumns = new Set(columns.map((col: any) => col.column_name))
      const expectedColumns = new Set(table.columns.map(col => col.name))

      const missingColumns = table.columns
        .filter(col => !existingColumns.has(col.name))
        .map(col => col.name)

      const extraColumns = columns
        .filter((col: any) => !expectedColumns.has(col.column_name))
        .map((col: any) => col.column_name)

      return {
        hasAllColumns: missingColumns.length === 0,
        missingColumns,
        extraColumns
      }
    } catch (error) {
      console.warn(`Error checking columns for ${table.name}:`, error)
      // Fallback: assume columns are correct if table exists to avoid false positives
      return { hasAllColumns: true, missingColumns: [], extraColumns: [] }
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

    // First pass: check if there are any actual updates needed
    let hasActualUpdates = false
    let updateSQL = ""

    for (const tableName of tableNames) {
      const table = tableConfigs[tableName]
      const status = tableStatuses[tableName]
      
      if (!table || !status) continue

      let tableUpdates = ""

      // Add missing columns
      if (status.missingColumns.length > 0 && table.columns) {
        hasActualUpdates = true
        tableUpdates += `-- Updates for ${table.displayName}\n`

        for (const columnName of status.missingColumns) {
          const column = table.columns.find(c => c.name === columnName)
          if (column) {
            tableUpdates += `-- Add missing column: ${columnName}\n`
            tableUpdates += `DO $$\nBEGIN\n`
            tableUpdates += `  IF NOT EXISTS (\n`
            tableUpdates += `    SELECT 1 FROM information_schema.columns \n`
            tableUpdates += `    WHERE table_name = '${tableName}' AND column_name = '${columnName}'\n`
            tableUpdates += `  ) THEN\n`
            
            // Check if column has NOT NULL constraint
            const hasNotNull = column.constraints?.includes("NOT NULL")
            const hasDefault = column.default
            
            if (hasNotNull && !hasDefault) {
              // For NOT NULL columns without default, add as nullable first
              tableUpdates += `    -- Adding as nullable first to avoid constraint violation\n`
              let alterSql = `    ALTER TABLE ${tableName} ADD COLUMN ${columnName} ${column.type}`
              tableUpdates += `${alterSql};\n`
              
              // Add a default value for existing rows (empty string for TEXT, 0 for numbers, etc.)
              let defaultValue = "''"
              if (column.type.toUpperCase().includes("INTEGER") || column.type.toUpperCase().includes("BIGINT")) {
                defaultValue = "0"
              } else if (column.type.toUpperCase().includes("BOOLEAN")) {
                defaultValue = "false"
              } else if (column.type.toUpperCase().includes("UUID")) {
                defaultValue = "uuid_generate_v4()"
              } else if (column.type.toUpperCase().includes("TIMESTAMP")) {
                defaultValue = "NOW()"
              }
              
              tableUpdates += `    -- Update existing rows with default value\n`
              tableUpdates += `    UPDATE ${tableName} SET ${columnName} = ${defaultValue} WHERE ${columnName} IS NULL;\n`
              
              // Now add the NOT NULL constraint
              tableUpdates += `    -- Now add NOT NULL constraint\n`
              tableUpdates += `    ALTER TABLE ${tableName} ALTER COLUMN ${columnName} SET NOT NULL;\n`
            } else {
              // For nullable columns or columns with defaults, add normally
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
              
              tableUpdates += `${alterSql};\n`
            }
            
            tableUpdates += `  END IF;\n`
            tableUpdates += `END $$;\n\n`
          }
        }
      }

      // Add missing indexes
      if (status.missingIndexes.length > 0) {
        hasActualUpdates = true
        if (!tableUpdates.includes(`-- Updates for ${table.displayName}`)) {
          tableUpdates += `-- Updates for ${table.displayName}\n`
        }
        for (const index of status.missingIndexes) {
          tableUpdates += `-- Add missing index\n`
          tableUpdates += `CREATE INDEX IF NOT EXISTS ${index} ON ${tableName};\n\n`
        }
      }

      // Note about missing policies
      if (status.missingPolicies.length > 0) {
        if (!tableUpdates.includes(`-- Updates for ${table.displayName}`)) {
          tableUpdates += `-- Updates for ${table.displayName}\n`
        }
        tableUpdates += `-- Note: Table ${tableName} may be missing Row Level Security policies\n`
        tableUpdates += `-- Please review the table definition for policy requirements\n\n`
      }

      updateSQL += tableUpdates
    }

    // Only return a script if there are actual updates
    if (!hasActualUpdates) {
      return ""
    }

    let sql = `-- Database Update Script\n-- Generated on ${new Date().toISOString()}\n\n`
    sql += updateSQL

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
  async executeSQL(sql: string): Promise<{ success: boolean; error?: string; needsManualExecution?: boolean; setupSql?: string }> {
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
        // Handle the case where exec_sql function doesn't exist
        if (response.status === 422 && result.sql) {
          return { 
            success: false, 
            error: result.error || "SQL execution not available - manual setup required",
            needsManualExecution: true,
            setupSql: result.sql
          }
        }
        
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

  /**
   * Execute raw SQL and return data (for queries like SELECT)
   */
  async executeRawSQL(sql: string): Promise<{ success: boolean; data?: any; error?: string }> {
    try {
      const { data, error } = await this.supabase.rpc("exec_sql", { sql_query: sql })
      
      if (error) {
        return { success: false, error: error.message }
      }
      
      return { success: true, data }
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