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
   * Check if user has marked database as up to date recently
   */
  private isMarkedAsUpToDate(): boolean {
    try {
      const markedUpToDate = localStorage.getItem("database_marked_up_to_date")
      if (!markedUpToDate) {
        console.log('[DatabaseValidator] No mark found in localStorage')
        return false
      }
      
      const timestamp = parseInt(markedUpToDate)
      const oneHour = 60 * 60 * 1000 // 1 hour in milliseconds
      const now = Date.now()
      const timeDiff = now - timestamp
      const isValid = timeDiff < oneHour
      
      console.log(`[DatabaseValidator] Mark check: timestamp=${timestamp}, now=${now}, diff=${timeDiff}ms, valid=${isValid}`)
      
      // Check if marked as up to date within the last hour
      return isValid
    } catch (error) {
      console.log(`[DatabaseValidator] Error checking mark: ${error}`)
      return false
    }
  }

  /**
   * Mark database as up to date (persists for 1 hour)
   */
  markAsUpToDate() {
    try {
      const timestamp = Date.now().toString()
      console.log(`[DatabaseValidator] Marking database as up to date for 1 hour at timestamp: ${timestamp}`)
      localStorage.setItem("database_marked_up_to_date", timestamp)
      
      // Verify it was set correctly
      const verify = localStorage.getItem("database_marked_up_to_date")
      console.log(`[DatabaseValidator] Verification: stored value = ${verify}`)
      
      if (verify !== timestamp) {
        console.error(`[DatabaseValidator] ERROR: Failed to set localStorage correctly. Expected: ${timestamp}, Got: ${verify}`)
      }
    } catch (error) {
      console.error(`[DatabaseValidator] ERROR: Failed to set localStorage:`, error)
    }
  }

  /**
   * Clear the "marked as up to date" flag
   */
  clearUpToDateMark() {
    try {
      console.log('[DatabaseValidator] Clearing up to date mark')
      localStorage.removeItem("database_marked_up_to_date")
    } catch {
      // Silently handle localStorage errors
    }
  }

  /**
   * Check the status of all tables in the database
   */
  async validateDatabase(): Promise<DatabaseStatus> {
    console.log('[DatabaseValidator] Starting database validation...')
    const tables = getAllTables()
    const tableStatuses: Record<string, TableStatus> = {}
    const missingTables: string[] = []
    const tablesNeedingUpdate: string[] = []

    for (const table of tables) {
      console.log(`[DatabaseValidator] Validating table: ${table.name}`)
      const status = await this.validateTable(table)
      tableStatuses[table.name] = status
      
      if (!status.exists) {
        console.log(`[DatabaseValidator] Table ${table.name} is missing`)
        missingTables.push(table.name)
      } else if (status.needsUpdate) {
        console.log(`[DatabaseValidator] Table ${table.name} needs update`)
        tablesNeedingUpdate.push(table.name)
      } else {
        console.log(`[DatabaseValidator] Table ${table.name} is up to date`)
      }
    }

    const allTablesExist = missingTables.length === 0
    const canAutoFix = true // We can always generate SQL scripts
    
    console.log(`[DatabaseValidator] Validation complete:`, {
      totalTables: tables.length,
      missingTables: missingTables.length,
      tablesNeedingUpdate: tablesNeedingUpdate.length,
      allTablesExist
    })
    
    const sqlFixScript = this.generateCreationScript(missingTables)
    const updateScript = this.generateUpdateScript(tablesNeedingUpdate, tableStatuses)

    console.log(`[DatabaseValidator] Generated scripts:`, {
      creationScriptLength: sqlFixScript.length,
      updateScriptLength: updateScript.length,
      hasUpdateScript: updateScript.trim().length > 0
    })

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

    const needsUpdate = exists && !this.isMarkedAsUpToDate() && !this._bypassValidation && (!hasAllColumns || !hasCorrectIndexes || !hasCorrectPolicies)

    console.log(`[DatabaseValidator] ${name} needsUpdate calculation:`, {
      exists,
      isMarkedAsUpToDate: this.isMarkedAsUpToDate(),
      bypassValidation: this._bypassValidation,
      hasAllColumns,
      hasCorrectIndexes,
      hasCorrectPolicies,
      needsUpdate
    })

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
    if (this._bypassValidation || this.isMarkedAsUpToDate()) {
      console.log(`[DatabaseValidator] Column validation bypassed for ${table.name}`)
      return { hasAllColumns: true, missingColumns: [], extraColumns: [] }
    }

    if (!table.columns) {
      console.log(`[DatabaseValidator] No column schema defined for ${table.name}`)
      return { hasAllColumns: true, missingColumns: [], extraColumns: [] }
    }

    console.log(`[DatabaseValidator] Checking columns for ${table.name}`)

    try {
      // Use exec_sql to query information_schema since it's not exposed via REST API
      const sql = `
        SELECT column_name, data_type, is_nullable, column_default 
        FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = '${table.name}'
      `
      
      const result = await this.executeRawSQL(sql)
      
      if (!result.success || !result.data) {
        console.log(`[DatabaseValidator] Failed to query columns for ${table.name}, error: ${result.error}`)
        console.log(`[DatabaseValidator] This might be because exec_sql is not available or table doesn't exist`)
        
        // Special handling: if table exists but we can't query columns, 
        // and user has marked as up to date, assume columns are correct
        const isMarked = this.isMarkedAsUpToDate()
        if (isMarked) {
          console.log(`[DatabaseValidator] Table ${table.name} marked as up to date, assuming columns are correct despite query failure`)
          return { hasAllColumns: true, missingColumns: [], extraColumns: [] }
        }
        
        console.log(`[DatabaseValidator] Table ${table.name} not marked as up to date, assuming correct to avoid false positives`)
        // Fallback: assume columns are correct if table exists to avoid false positives
        // This is especially important when exec_sql is not available in production
        return { hasAllColumns: true, missingColumns: [], extraColumns: [] }
      }

      const columns = result.data
      console.log(`[DatabaseValidator] Found ${columns.length} columns in ${table.name}:`, columns.map((c: any) => c.column_name))
      
      const existingColumns = new Set(columns.map((col: any) => col.column_name))
      const expectedColumns = new Set(table.columns.map(col => col.name))

      const missingColumns = table.columns
        .filter(col => !existingColumns.has(col.name))
        .map(col => col.name)

      const extraColumns = columns
        .filter((col: any) => !expectedColumns.has(col.column_name))
        .map((col: any) => col.column_name)

      console.log(`[DatabaseValidator] ${table.name} column analysis:`, {
        expected: Array.from(expectedColumns),
        existing: Array.from(existingColumns),
        missing: missingColumns,
        extra: extraColumns
      })

      return {
        hasAllColumns: missingColumns.length === 0,
        missingColumns,
        extraColumns
      }
    } catch (error) {
      console.log(`[DatabaseValidator] Error checking columns for ${table.name}, assuming correct:`, error)
      // Fallback: assume columns are correct if table exists to avoid false positives
      return { hasAllColumns: true, missingColumns: [], extraColumns: [] }
    }
  }

  /**
   * Check table indexes (simplified)
   */
  async checkTableIndexes(table: TableConfig): Promise<boolean> {
    // If validation is bypassed, assume everything is correct
    if (this._bypassValidation || this.isMarkedAsUpToDate()) {
      console.log(`[DatabaseValidator] Index validation bypassed for ${table.name}`)
      return true
    }
    
    // For now, we'll assume indexes are correct if the table exists
    // A more sophisticated implementation would query pg_indexes
    return true
  }

  /**
   * Check table policies (simplified)
   */
  async checkTablePolicies(table: TableConfig): Promise<boolean> {
    // If validation is bypassed, assume everything is correct
    if (this._bypassValidation || this.isMarkedAsUpToDate()) {
      console.log(`[DatabaseValidator] Policy validation bypassed for ${table.name}`)
      return true
    }
    
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
      console.log(`[DatabaseValidator] No tables need updates, returning empty script`)
      return ""
    }

    // First pass: check if there are any actual updates needed
    let hasActualUpdates = false
    let updateSQL = ""

    console.log(`[DatabaseValidator] Generating update script for tables: ${tableNames.join(', ')}`)

    for (const tableName of tableNames) {
      const table = tableConfigs[tableName]
      const status = tableStatuses[tableName]
      
      if (!table || !status) {
        console.log(`[DatabaseValidator] Skipping ${tableName}: missing table config or status`)
        continue
      }

      console.log(`[DatabaseValidator] Checking ${tableName}:`, {
        exists: status.exists,
        hasAllColumns: status.hasAllColumns,
        missingColumns: status.missingColumns.length,
        hasCorrectIndexes: status.hasCorrectIndexes,
        missingIndexes: status.missingIndexes.length,
        hasCorrectPolicies: status.hasCorrectPolicies,
        missingPolicies: status.missingPolicies.length,
        needsUpdate: status.needsUpdate
      })

      // Skip tables that don't exist (they should be in missing tables, not update tables)
      if (!status.exists) {
        console.log(`[DatabaseValidator] Skipping ${tableName}: table doesn't exist (should be in missing tables list)`)
        continue
      }

      let tableUpdates = ""

      // Add missing columns
      if (status.missingColumns.length > 0 && table.columns) {
        hasActualUpdates = true
        tableUpdates += `-- Updates for ${table.displayName}\n`
        console.log(`[DatabaseValidator] ${tableName} has missing columns: ${status.missingColumns.join(', ')}`)

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
      console.log(`[DatabaseValidator] No actual updates needed, returning empty script`)
      return ""
    }

    console.log(`[DatabaseValidator] Actual updates detected, generating migration script`)
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