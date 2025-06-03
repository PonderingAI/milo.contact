/**
 * Step-by-step analysis of database table validation system
 * This test walks through exactly how tables are checked and why the banner appears
 */

import { databaseValidator } from '../lib/database/validator.js'
import { getAllTables, tableConfigs } from '../lib/database/schema.js'

describe('Database Validation Step-by-Step Analysis', () => {
  let originalConsoleLog
  let consoleLogs = []

  beforeEach(() => {
    // Clear any stored state
    databaseValidator.clearUpToDateMark()
    databaseValidator.bypassValidation(false)
    
    // Capture console logs for debugging
    originalConsoleLog = console.log
    consoleLogs = []
    console.log = (...args) => {
      consoleLogs.push(args.join(' '))
      originalConsoleLog(...args)
    }
  })

  afterEach(() => {
    console.log = originalConsoleLog
  })

  test('Step 1: Check which tables are defined in schema', () => {
    const tables = getAllTables()
    console.log('\n=== STEP 1: Schema Analysis ===')
    console.log(`Total tables defined in schema: ${tables.length}`)
    
    tables.forEach(table => {
      console.log(`- ${table.name} (${table.displayName}) - Required: ${table.required}`)
      if (table.columns) {
        console.log(`  Columns: ${table.columns.map(c => c.name).join(', ')}`)
      }
    })

    // Verify BTS images table is in schema
    const btsTable = tables.find(t => t.name === 'bts_images')
    expect(btsTable).toBeDefined()
    expect(btsTable.name).toBe('bts_images')
    
    // Check if BTS table has the correct columns as reported by user
    const expectedColumns = ['id', 'project_id', 'image_url', 'caption', 'size', 'aspect_ratio', 'created_at', 'category']
    if (btsTable.columns) {
      const actualColumns = btsTable.columns.map(c => c.name)
      console.log(`BTS table schema columns: ${actualColumns.join(', ')}`)
      
      for (const col of expectedColumns) {
        if (!actualColumns.includes(col)) {
          console.log(`WARNING: Expected column '${col}' not found in schema`)
        }
      }
    }
  })

  test('Step 2: Test table existence checking mechanism', async () => {
    console.log('\n=== STEP 2: Table Existence Checking ===')
    
    const tables = getAllTables()
    
    for (const table of tables) {
      console.log(`Checking if table '${table.name}' exists...`)
      
      try {
        const exists = await databaseValidator.checkTableExists(table.name)
        console.log(`  Result: ${table.name} exists = ${exists}`)
      } catch (error) {
        console.log(`  Error checking ${table.name}: ${error.message}`)
      }
    }
  })

  test('Step 3: Test column validation mechanism', async () => {
    console.log('\n=== STEP 3: Column Validation ===')
    
    // Test specifically on bts_images table since that's the issue
    const btsTable = tableConfigs.bts_images
    expect(btsTable).toBeDefined()
    
    console.log(`Testing column validation for '${btsTable.name}'...`)
    console.log(`Schema defines ${btsTable.columns?.length || 0} columns`)
    
    try {
      const columnResult = await databaseValidator.checkTableColumns(btsTable)
      console.log(`Column check result:`, columnResult)
      
      if (columnResult.missingColumns.length > 0) {
        console.log(`Missing columns: ${columnResult.missingColumns.join(', ')}`)
      }
      
      if (columnResult.extraColumns.length > 0) {
        console.log(`Extra columns: ${columnResult.extraColumns.join(', ')}`)
      }
    } catch (error) {
      console.log(`Error checking columns: ${error.message}`)
    }
  })

  test('Step 4: Test individual table validation', async () => {
    console.log('\n=== STEP 4: Individual Table Validation ===')
    
    const btsTable = tableConfigs.bts_images
    
    console.log(`Validating table: ${btsTable.name}`)
    
    try {
      const tableStatus = await databaseValidator.validateTable(btsTable)
      
      console.log(`Table status for ${btsTable.name}:`)
      console.log(`  - exists: ${tableStatus.exists}`)
      console.log(`  - hasAllColumns: ${tableStatus.hasAllColumns}`)
      console.log(`  - hasCorrectIndexes: ${tableStatus.hasCorrectIndexes}`)
      console.log(`  - hasCorrectPolicies: ${tableStatus.hasCorrectPolicies}`)
      console.log(`  - needsUpdate: ${tableStatus.needsUpdate}`)
      
      if (tableStatus.missingColumns.length > 0) {
        console.log(`  - missingColumns: [${tableStatus.missingColumns.join(', ')}]`)
      }
      
      if (tableStatus.extraColumns.length > 0) {
        console.log(`  - extraColumns: [${tableStatus.extraColumns.join(', ')}]`)
      }
      
      // This tells us exactly why a table might need updates
      if (tableStatus.needsUpdate) {
        console.log(`  >> TABLE NEEDS UPDATE because:`)
        if (!tableStatus.hasAllColumns) console.log(`     - Missing columns`)
        if (!tableStatus.hasCorrectIndexes) console.log(`     - Missing indexes`)
        if (!tableStatus.hasCorrectPolicies) console.log(`     - Missing policies`)
      }
      
    } catch (error) {
      console.log(`Error validating table: ${error.message}`)
    }
  })

  test('Step 5: Test full database validation (what triggers banner)', async () => {
    console.log('\n=== STEP 5: Full Database Validation ===')
    
    try {
      const databaseStatus = await databaseValidator.validateDatabase()
      
      console.log(`Full database validation result:`)
      console.log(`  - allTablesExist: ${databaseStatus.allTablesExist}`)
      console.log(`  - missingTables: [${databaseStatus.missingTables.join(', ')}]`)
      console.log(`  - tablesNeedingUpdate: [${databaseStatus.tablesNeedingUpdate.join(', ')}]`)
      console.log(`  - updateScript length: ${databaseStatus.updateScript.length}`)
      console.log(`  - sqlFixScript length: ${databaseStatus.sqlFixScript.length}`)
      
      // This is what controls the banner visibility
      const shouldShowBanner = databaseStatus.updateScript && databaseStatus.updateScript.trim().length > 0
      console.log(`  >> BANNER SHOULD SHOW: ${shouldShowBanner}`)
      
      if (shouldShowBanner) {
        console.log(`  >> Banner triggers because updateScript has content`)
        console.log(`  >> First 200 chars of updateScript: "${databaseStatus.updateScript.substring(0, 200)}..."`)
      }
      
      // Test each table status individually
      Object.entries(databaseStatus.tableStatuses).forEach(([tableName, status]) => {
        if (status.needsUpdate) {
          console.log(`  >> Table '${tableName}' needs update:`)
          console.log(`     - hasAllColumns: ${status.hasAllColumns}`)
          console.log(`     - hasCorrectIndexes: ${status.hasCorrectIndexes}`)
          console.log(`     - hasCorrectPolicies: ${status.hasCorrectPolicies}`)
        }
      })
      
    } catch (error) {
      console.log(`Error in full validation: ${error.message}`)
      throw error
    }
  })

  test('Step 6: Test "mark as up to date" functionality', async () => {
    console.log('\n=== STEP 6: Mark as Up to Date Test ===')
    
    // First, run validation to see current state
    const beforeStatus = await databaseValidator.validateDatabase()
    console.log(`Before marking as up to date:`)
    console.log(`  - tablesNeedingUpdate: [${beforeStatus.tablesNeedingUpdate.join(', ')}]`)
    console.log(`  - updateScript length: ${beforeStatus.updateScript.length}`)
    
    // Mark as up to date
    console.log(`Marking database as up to date...`)
    databaseValidator.markAsUpToDate()
    
    // Check if it's marked
    const isMarked = databaseValidator.isValidationBypassed()
    console.log(`Validation bypassed: ${isMarked}`)
    
    // Run validation again
    const afterStatus = await databaseValidator.validateDatabase()
    console.log(`After marking as up to date:`)
    console.log(`  - tablesNeedingUpdate: [${afterStatus.tablesNeedingUpdate.join(', ')}]`)
    console.log(`  - updateScript length: ${afterStatus.updateScript.length}`)
    
    const shouldShowBannerAfter = afterStatus.updateScript && afterStatus.updateScript.trim().length > 0
    console.log(`  >> BANNER SHOULD SHOW AFTER MARKING: ${shouldShowBannerAfter}`)
    
    if (shouldShowBannerAfter && beforeStatus.updateScript.length > 0) {
      console.log(`  >> ERROR: Banner still shows even after marking as up to date!`)
      console.log(`  >> This indicates the markAsUpToDate mechanism is not working properly`)
    }
  })

  test('Step 7: Analyze specific BTS table validation', async () => {
    console.log('\n=== STEP 7: BTS Table Specific Analysis ===')
    
    const btsTable = tableConfigs.bts_images
    
    console.log(`BTS Table Definition:`)
    console.log(`  - Name: ${btsTable.name}`)
    console.log(`  - Required: ${btsTable.required}`)
    console.log(`  - Category: ${btsTable.category}`)
    console.log(`  - Dependencies: [${btsTable.dependencies.join(', ')}]`)
    
    if (btsTable.columns) {
      console.log(`  - Schema Columns:`)
      btsTable.columns.forEach(col => {
        console.log(`    * ${col.name}: ${col.type}${col.constraints ? ` (${col.constraints.join(', ')})` : ''}${col.default ? ` DEFAULT ${col.default}` : ''}`)
      })
    }
    
    // Test if table exists
    const exists = await databaseValidator.checkTableExists(btsTable.name)
    console.log(`  - Table exists in database: ${exists}`)
    
    if (exists) {
      // Test column validation
      const columnCheck = await databaseValidator.checkTableColumns(btsTable)
      console.log(`  - Column validation:`)
      console.log(`    * hasAllColumns: ${columnCheck.hasAllColumns}`)
      console.log(`    * missingColumns: [${columnCheck.missingColumns.join(', ')}]`)
      console.log(`    * extraColumns: [${columnCheck.extraColumns.join(', ')}]`)
      
      // Full table validation
      const tableStatus = await databaseValidator.validateTable(btsTable)
      console.log(`  - Full validation needsUpdate: ${tableStatus.needsUpdate}`)
      
      if (tableStatus.needsUpdate) {
        console.log(`  >> BTS table needs update! This could explain the persistent banner.`)
      }
    } else {
      console.log(`  >> BTS table does not exist! This explains the banner.`)
    }
  })

  test('Step 8: Check localStorage behavior', () => {
    console.log('\n=== STEP 8: LocalStorage Analysis ===')
    
    // Test localStorage access
    try {
      // Clear any existing marks
      localStorage.removeItem("database_marked_up_to_date")
      console.log(`Cleared localStorage mark`)
      
      // Check if marking works
      databaseValidator.markAsUpToDate()
      const stored = localStorage.getItem("database_marked_up_to_date")
      console.log(`After marking, localStorage value: ${stored}`)
      
      if (stored) {
        const timestamp = parseInt(stored)
        const now = Date.now()
        const diff = now - timestamp
        console.log(`Mark was set ${diff}ms ago`)
        console.log(`Mark should be valid for: ${60 * 60 * 1000}ms (1 hour)`)
        console.log(`Mark is currently valid: ${diff < 60 * 60 * 1000}`)
      }
      
      // Test clearing
      databaseValidator.clearUpToDateMark()
      const clearedStored = localStorage.getItem("database_marked_up_to_date")
      console.log(`After clearing, localStorage value: ${clearedStored}`)
      
    } catch (error) {
      console.log(`LocalStorage error: ${error.message}`)
    }
  })
})