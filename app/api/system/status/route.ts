import { NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase-server"

/**
 * Unified System Status API
 * Consolidates multiple system check endpoints into a single efficient API
 * Combines database diagnostics, setup status, and system health checks
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const checks = searchParams.get('checks')?.split(',') || ['all']
    const format = searchParams.get('format') || 'detailed'
    
    const supabase = createAdminClient()
    const results: Record<string, any> = {}

    // Check if we should run all checks or specific ones
    const shouldCheck = (checkName: string) => 
      checks.includes('all') || checks.includes(checkName)

    // 1. Database Health Check
    if (shouldCheck('database')) {
      try {
        // Quick connection test
        const { data: connectionTest, error: connectionError } = await supabase
          .rpc('check_connection')
          .maybeSingle()

        if (connectionError) {
          // Fallback to a simple query if RPC doesn't exist
          const { data: fallbackTest, error: fallbackError } = await supabase
            .from('site_settings')
            .select('key')
            .limit(1)
            .maybeSingle()

          results.database = {
            status: fallbackError ? 'error' : 'ok',
            connected: !fallbackError,
            method: 'fallback',
            error: fallbackError?.message
          }
        } else {
          results.database = {
            status: 'ok',
            connected: true,
            method: 'rpc',
            details: connectionTest
          }
        }
      } catch (error) {
        results.database = {
          status: 'error',
          connected: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        }
      }
    }

    // 2. Essential Tables Check
    if (shouldCheck('tables')) {
      const essentialTables = ['projects', 'media', 'site_settings']
      const tableStatus: Record<string, any> = {}

      for (const tableName of essentialTables) {
        try {
          const { data, error } = await supabase
            .from(tableName)
            .select('*')
            .limit(1)
            .maybeSingle()

          tableStatus[tableName] = {
            exists: !error || error.code !== "42P01",
            status: (!error || error.code !== "42P01") ? 'ok' : 'missing',
            hasData: !!data,
            error: error?.code === "42P01" ? 'Table does not exist' : error?.message
          }
        } catch (error) {
          tableStatus[tableName] = {
            exists: false,
            status: 'error',
            hasData: false,
            error: error instanceof Error ? error.message : 'Unknown error'
          }
        }
      }

      results.tables = {
        status: Object.values(tableStatus).every((t: any) => t.status === 'ok') ? 'ok' : 'incomplete',
        details: tableStatus
      }
    }

    // 3. Storage Health Check
    if (shouldCheck('storage')) {
      try {
        const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets()
        
        if (bucketsError) {
          results.storage = {
            status: 'error',
            error: bucketsError.message
          }
        } else {
          const requiredBuckets = ['projects', 'icons', 'media', 'public']
          const existingBuckets = new Set(buckets?.map(b => b.name) || [])
          const missingBuckets = requiredBuckets.filter(name => !existingBuckets.has(name))
          
          results.storage = {
            status: missingBuckets.length === 0 ? 'ok' : 'incomplete',
            bucketsCount: existingBuckets.size,
            missing: missingBuckets,
            hasAllRequired: missingBuckets.length === 0
          }

          if (format === 'detailed') {
            results.storage.buckets = Array.from(existingBuckets)
          }
        }
      } catch (error) {
        results.storage = {
          status: 'error',
          error: error instanceof Error ? error.message : 'Unknown error'
        }
      }
    }

    // 4. API Health Check
    if (shouldCheck('api')) {
      const apiEndpoints = [
        '/api/ping',
        '/api/database/diagnostics',
        '/api/batch'
      ]

      const apiStatus: Record<string, any> = {}
      const { origin } = new URL(request.url)

      for (const endpoint of apiEndpoints) {
        try {
          const response = await fetch(new URL(endpoint, origin))
          apiStatus[endpoint] = {
            status: response.ok ? 'ok' : 'error',
            statusCode: response.status,
            responseTime: Date.now() // Simplified timing
          }
        } catch (error) {
          apiStatus[endpoint] = {
            status: 'error',
            error: error instanceof Error ? error.message : 'Unknown error'
          }
        }
      }

      results.api = {
        status: Object.values(apiStatus).every((a: any) => a.status === 'ok') ? 'ok' : 'degraded',
        endpoints: apiStatus
      }
    }

    // 5. Overall System Health
    const systemChecks = Object.values(results)
    const hasErrors = systemChecks.some((check: any) => check.status === 'error')
    const hasIncomplete = systemChecks.some((check: any) => 
      check.status === 'incomplete' || check.status === 'degraded'
    )

    const overallStatus = hasErrors ? 'error' : hasIncomplete ? 'warning' : 'healthy'

    const response = NextResponse.json({
      system: {
        status: overallStatus,
        healthy: overallStatus === 'healthy',
        timestamp: new Date().toISOString(),
        checksRequested: checks,
        format
      },
      results,
      summary: format === 'simple' ? {
        database: results.database?.status || 'not-checked',
        tables: results.tables?.status || 'not-checked',
        storage: results.storage?.status || 'not-checked',
        api: results.api?.status || 'not-checked'
      } : undefined
    })

    // Cache system status for a short time to reduce redundant checks
    response.headers.set('Cache-Control', 'public, max-age=30, s-maxage=30')

    return response

  } catch (error) {
    console.error("Error in system status check:", error)
    return NextResponse.json(
      {
        system: {
          status: 'error',
          healthy: false,
          timestamp: new Date().toISOString()
        },
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      },
      { status: 500 }
    )
  }
}