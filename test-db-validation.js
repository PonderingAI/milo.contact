/**
 * Direct Node.js script to test database validation step by step
 * This bypasses Jest configuration issues
 */

async function testDatabaseValidation() {
  console.log('=== DATABASE VALIDATION STEP-BY-STEP ANALYSIS ===\n')
  
  try {
    // Mock localStorage for Node.js environment
    global.localStorage = {
      storage: {},
      getItem: function(key) { return this.storage[key] || null; },
      setItem: function(key, value) { this.storage[key] = value; },
      removeItem: function(key) { delete this.storage[key]; }
    }

    // Import the modules we need to test
    const { databaseValidator } = await import('./lib/database/validator.ts')
    const { getAllTables, tableConfigs } = await import('./lib/database/schema.ts')
    
    console.log('Step 1: Schema Analysis')
    console.log('========================')
    const tables = getAllTables()
    console.log(`Total tables defined in schema: ${tables.length}`)
    
    tables.forEach(table => {
      console.log(`- ${table.name} (${table.displayName}) - Required: ${table.required}`)
      if (table.columns) {
        console.log(`  Columns: ${table.columns.map(c => c.name).join(', ')}`)
      }
    })

    // Verify BTS images table is in schema
    const btsTable = tables.find(t => t.name === 'bts_images')
    if (!btsTable) {
      console.log('ERROR: BTS images table not found in schema!')
      return
    }
    
    console.log(`\nBTS Table Found: ${btsTable.name}`)
    console.log(`BTS Table Columns: ${btsTable.columns ? btsTable.columns.map(c => c.name).join(', ') : 'None defined'}`)
    
    console.log('\n\nStep 2: Table Existence Checking')
    console.log('=================================')
    
    for (const table of tables.slice(0, 3)) { // Test first 3 tables to avoid too much output
      console.log(`Checking if table '${table.name}' exists...`)
      
      try {
        const exists = await databaseValidator.checkTableExists(table.name)
        console.log(`  Result: ${table.name} exists = ${exists}`)
      } catch (error) {
        console.log(`  Error checking ${table.name}: ${error.message}`)
      }
    }
    
    console.log('\n\nStep 3: BTS Table Specific Validation')
    console.log('======================================')
    
    console.log(`Testing BTS table: ${btsTable.name}`)
    
    try {
      // Test if table exists
      const exists = await databaseValidator.checkTableExists(btsTable.name)
      console.log(`BTS table exists: ${exists}`)
      
      if (exists) {
        // Test column validation
        const columnCheck = await databaseValidator.checkTableColumns(btsTable)
        console.log(`Column validation result:`)
        console.log(`  - hasAllColumns: ${columnCheck.hasAllColumns}`)
        console.log(`  - missingColumns: [${columnCheck.missingColumns.join(', ')}]`)
        console.log(`  - extraColumns: [${columnCheck.extraColumns.join(', ')}]`)
        
        // Full table validation
        const tableStatus = await databaseValidator.validateTable(btsTable)
        console.log(`Full table validation:`)
        console.log(`  - exists: ${tableStatus.exists}`)
        console.log(`  - hasAllColumns: ${tableStatus.hasAllColumns}`)
        console.log(`  - hasCorrectIndexes: ${tableStatus.hasCorrectIndexes}`)
        console.log(`  - hasCorrectPolicies: ${tableStatus.hasCorrectPolicies}`)
        console.log(`  - needsUpdate: ${tableStatus.needsUpdate}`)
        
        if (tableStatus.needsUpdate) {
          console.log(`\n>>> BTS TABLE NEEDS UPDATE! This explains the persistent banner.`)
          console.log(`Reasons:`)
          if (!tableStatus.hasAllColumns) console.log(`  - Missing columns: ${tableStatus.missingColumns.join(', ')}`)
          if (!tableStatus.hasCorrectIndexes) console.log(`  - Missing indexes`)
          if (!tableStatus.hasCorrectPolicies) console.log(`  - Missing policies`)
        }
      } else {
        console.log(`\n>>> BTS TABLE DOES NOT EXIST! This explains the persistent banner.`)
      }
    } catch (error) {
      console.log(`Error validating BTS table: ${error.message}`)
      console.log(`Full error:`, error)
    }
    
    console.log('\n\nStep 4: Full Database Validation')
    console.log('=================================')
    
    try {
      const databaseStatus = await databaseValidator.validateDatabase()
      
      console.log(`Full database validation result:`)
      console.log(`  - allTablesExist: ${databaseStatus.allTablesExist}`)
      console.log(`  - missingTables: [${databaseStatus.missingTables.join(', ')}]`)
      console.log(`  - tablesNeedingUpdate: [${databaseStatus.tablesNeedingUpdate.join(', ')}]`)
      console.log(`  - updateScript length: ${databaseStatus.updateScript.length}`)
      
      // This is what controls the banner visibility
      const shouldShowBanner = databaseStatus.updateScript && databaseStatus.updateScript.trim().length > 0
      console.log(`\n>>> BANNER SHOULD SHOW: ${shouldShowBanner}`)
      
      if (shouldShowBanner) {
        console.log(`>>> Banner shows because updateScript has ${databaseStatus.updateScript.length} characters`)
        console.log(`>>> Tables needing update: ${databaseStatus.tablesNeedingUpdate.join(', ')}`)
        if (databaseStatus.updateScript.length < 1000) {
          console.log(`>>> Update script content:\n${databaseStatus.updateScript}`)
        } else {
          console.log(`>>> Update script preview (first 500 chars):\n${databaseStatus.updateScript.substring(0, 500)}...`)
        }
      }
      
    } catch (error) {
      console.log(`Error in full validation: ${error.message}`)
      console.log(`Full error:`, error)
    }
    
    console.log('\n\nStep 5: Mark as Up to Date Test')
    console.log('================================')
    
    try {
      // Mark as up to date
      console.log(`Marking database as up to date...`)
      databaseValidator.markAsUpToDate()
      
      // Check if it's marked
      const marked = localStorage.getItem("database_marked_up_to_date")
      console.log(`localStorage value after marking: ${marked}`)
      
      if (marked) {
        const timestamp = parseInt(marked)
        const now = Date.now()
        const diff = now - timestamp
        console.log(`Mark was set ${diff}ms ago`)
        console.log(`Mark should be valid for: ${60 * 60 * 1000}ms (1 hour)`)
        console.log(`Mark is currently valid: ${diff < 60 * 60 * 1000}`)
      }
      
      // Run validation again
      const afterStatus = await databaseValidator.validateDatabase()
      console.log(`After marking as up to date:`)
      console.log(`  - tablesNeedingUpdate: [${afterStatus.tablesNeedingUpdate.join(', ')}]`)
      console.log(`  - updateScript length: ${afterStatus.updateScript.length}`)
      
      const shouldShowBannerAfter = afterStatus.updateScript && afterStatus.updateScript.trim().length > 0
      console.log(`\n>>> BANNER SHOULD SHOW AFTER MARKING: ${shouldShowBannerAfter}`)
      
      if (shouldShowBannerAfter) {
        console.log(`>>> ERROR: Banner still shows even after marking as up to date!`)
        console.log(`>>> This indicates the markAsUpToDate mechanism is not working properly`)
      } else {
        console.log(`>>> SUCCESS: Banner correctly hidden after marking as up to date`)
      }
      
    } catch (error) {
      console.log(`Error testing mark as up to date: ${error.message}`)
    }
    
  } catch (error) {
    console.log(`Fatal error: ${error.message}`)
    console.log(`Full error:`, error)
  }
}

// Run the test
testDatabaseValidation().then(() => {
  console.log('\n=== ANALYSIS COMPLETE ===')
}).catch(error => {
  console.error('Test failed:', error)
})