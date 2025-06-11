"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Textarea } from "@/components/ui/textarea"
import { databaseValidator } from "@/lib/database/validator"

export default function DatabaseDebugPage() {
  const [debugLog, setDebugLog] = useState<string[]>([])
  const [loading, setLoading] = useState(false)

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString()
    setDebugLog(prev => [...prev, `[${timestamp}] ${message}`])
  }

  const testLocalStorage = () => {
    addLog("Testing localStorage functionality...")
    
    try {
      // Test basic localStorage operations
      localStorage.setItem("test_key", "test_value")
      const retrieved = localStorage.getItem("test_key")
      localStorage.removeItem("test_key")
      
      addLog(`✓ localStorage works: set/get/remove successful (value: ${retrieved})`)
    } catch (error) {
      addLog(`✗ localStorage error: ${error}`)
    }
  }

  const testMarkAsUpToDate = () => {
    addLog("Testing mark as up to date functionality...")
    
    try {
      // Clear any existing mark
      databaseValidator.clearUpToDateMark()
      addLog("Cleared existing mark")
      
      // Check if marked (should be false)
      const beforeMark = localStorage.getItem("database_marked_up_to_date")
      addLog(`Before marking: ${beforeMark}`)
      
      // Mark as up to date
      databaseValidator.markAsUpToDate()
      addLog("Called markAsUpToDate()")
      
      // Check if marked (should have timestamp)
      const afterMark = localStorage.getItem("database_marked_up_to_date")
      addLog(`After marking: ${afterMark}`)
      
      if (afterMark) {
        const timestamp = parseInt(afterMark)
        const now = Date.now()
        const diff = now - timestamp
        addLog(`Mark timestamp: ${timestamp}`)
        addLog(`Current time: ${now}`)
        addLog(`Time difference: ${diff}ms`)
        addLog(`Is valid (< 1 hour): ${diff < 60 * 60 * 1000}`)
      }
      
    } catch (error) {
      addLog(`✗ Mark test error: ${error}`)
    }
  }

  const testDatabaseValidation = async () => {
    addLog("Testing database validation...")
    setLoading(true)
    
    try {
      // Run full database validation
      const status = await databaseValidator.validateDatabase()
      
      addLog(`✓ Validation completed`)
      addLog(`- All tables exist: ${status.allTablesExist}`)
      addLog(`- Missing tables: [${status.missingTables.join(', ')}]`)
      addLog(`- Tables needing update: [${status.tablesNeedingUpdate.join(', ')}]`)
      addLog(`- Update script length: ${status.updateScript.length}`)
      addLog(`- Creation script length: ${status.sqlFixScript.length}`)
      
      // Check if banner should show
      const shouldShowBanner = status.updateScript && status.updateScript.trim().length > 0
      addLog(`- Banner should show: ${shouldShowBanner}`)
      
      if (shouldShowBanner) {
        addLog(`- Update script preview: "${status.updateScript.substring(0, 200)}..."`)
      }
      
      // Test specific BTS table
      const btsStatus = status.tableStatuses['bts_images']
      if (btsStatus) {
        addLog(`BTS table status:`)
        addLog(`- exists: ${btsStatus.exists}`)
        addLog(`- hasAllColumns: ${btsStatus.hasAllColumns}`)
        addLog(`- needsUpdate: ${btsStatus.needsUpdate}`)
        if (btsStatus.missingColumns.length > 0) {
          addLog(`- missing columns: [${btsStatus.missingColumns.join(', ')}]`)
        }
      } else {
        addLog(`✗ BTS table status not found`)
      }
      
    } catch (error) {
      addLog(`✗ Validation error: ${error}`)
    } finally {
      setLoading(false)
    }
  }

  const testMarkThenValidate = async () => {
    addLog("Testing mark then validate workflow...")
    setLoading(true)
    
    try {
      // 1. Clear mark
      databaseValidator.clearUpToDateMark()
      addLog("1. Cleared mark")
      
      // 2. Run validation (should show issues)
      const beforeStatus = await databaseValidator.validateDatabase()
      addLog(`2. Before mark - tables needing update: [${beforeStatus.tablesNeedingUpdate.join(', ')}]`)
      addLog(`   Update script length: ${beforeStatus.updateScript.length}`)
      
      // 3. Mark as up to date
      databaseValidator.markAsUpToDate()
      addLog("3. Marked as up to date")
      
      // 4. Run validation again (should show no issues)
      const afterStatus = await databaseValidator.validateDatabase()
      addLog(`4. After mark - tables needing update: [${afterStatus.tablesNeedingUpdate.join(', ')}]`)
      addLog(`   Update script length: ${afterStatus.updateScript.length}`)
      
      // 5. Check banner logic
      const beforeBanner = beforeStatus.updateScript && beforeStatus.updateScript.trim().length > 0
      const afterBanner = afterStatus.updateScript && afterStatus.updateScript.trim().length > 0
      
      addLog(`5. Banner should show before: ${beforeBanner}`)
      addLog(`   Banner should show after: ${afterBanner}`)
      
      if (beforeBanner && !afterBanner) {
        addLog(`✓ SUCCESS: Mark as up to date correctly hides banner`)
      } else if (beforeBanner && afterBanner) {
        addLog(`✗ ISSUE: Mark as up to date did not hide banner`)
      } else {
        addLog(`ℹ No banner would show in either case`)
      }
      
    } catch (error) {
      addLog(`✗ Test error: ${error}`)
    } finally {
      setLoading(false)
    }
  }

  const clearLog = () => {
    setDebugLog([])
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Database Debug Tool</h1>
        <p className="text-muted-foreground mt-1">
          Step-by-step testing of database validation and banner logic
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Button onClick={testLocalStorage} disabled={loading}>
          Test localStorage
        </Button>
        <Button onClick={testMarkAsUpToDate} disabled={loading}>
          Test Mark as Up to Date
        </Button>
        <Button onClick={testDatabaseValidation} disabled={loading}>
          Test Database Validation
        </Button>
        <Button onClick={testMarkThenValidate} disabled={loading}>
          Test Full Workflow
        </Button>
      </div>

      <div className="flex gap-2">
        <Button variant="outline" onClick={clearLog}>
          Clear Log
        </Button>
        <Button 
          variant="outline" 
          onClick={() => {
            const logText = debugLog.join('\n')
            navigator.clipboard.writeText(logText)
          }}
        >
          Copy Log
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Debug Log</CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea
            value={debugLog.join('\n')}
            readOnly
            className="font-mono text-sm h-96"
            placeholder="Debug output will appear here..."
          />
        </CardContent>
      </Card>

      <Alert>
        <AlertDescription>
          Use this tool to test the database validation logic step by step. 
          This helps identify why the banner might be showing persistently.
        </AlertDescription>
      </Alert>
    </div>
  )
}