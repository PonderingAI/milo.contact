import { NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase-server"

/**
 * Unified database diagnostics endpoint
 * Consolidates multiple check endpoints into a single efficient API
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const checks = searchParams.get('checks')?.split(',') || ['all']
    
    const supabase = createAdminClient()
    const results: Record<string, any> = {}

    // Check if we should run all checks or specific ones
    const shouldCheck = (checkName: string) => 
      checks.includes('all') || checks.includes(checkName)

    // 1. Projects table check
    if (shouldCheck('projects')) {
      try {
        const { data: tableExists, error: tableError } = await supabase.rpc("check_table_exists", {
          table_name: "projects",
        })

        if (tableError) {
          results.projects = { 
            exists: false, 
            error: tableError.message,
            status: 'error'
          }
        } else {
          results.projects = { 
            exists: !!tableExists,
            status: tableExists ? 'ok' : 'missing'
          }

          // Get column info if table exists
          if (tableExists) {
            const { data: columns, error: columnsError } = await supabase.rpc("get_table_columns", {
              table_name: "projects",
            })
            
            if (!columnsError && columns) {
              results.projects.columns = columns
            }
          }
        }
      } catch (error) {
        results.projects = { 
          exists: false, 
          error: error instanceof Error ? error.message : 'Unknown error',
          status: 'error'
        }
      }
    }

    // 2. Media table check
    if (shouldCheck('media')) {
      try {
        const { data: mediaData, error: mediaError } = await supabase
          .from("media")
          .select("id")
          .limit(1)
          .maybeSingle()

        results.media = {
          exists: !mediaError || mediaError.code !== "42P01",
          status: (!mediaError || mediaError.code !== "42P01") ? 'ok' : 'missing',
          error: mediaError?.code === "42P01" ? 'Table does not exist' : mediaError?.message
        }
      } catch (error) {
        results.media = { 
          exists: false, 
          error: error instanceof Error ? error.message : 'Unknown error',
          status: 'error'
        }
      }
    }

    // 3. Site settings check
    if (shouldCheck('settings')) {
      try {
        const { data: settingsData, error: settingsError } = await supabase
          .from("site_settings")
          .select("key")
          .limit(1)
          .maybeSingle()

        results.settings = {
          exists: !settingsError || settingsError.code !== "42P01",
          status: (!settingsError || settingsError.code !== "42P01") ? 'ok' : 'missing',
          error: settingsError?.code === "42P01" ? 'Table does not exist' : settingsError?.message
        }
      } catch (error) {
        results.settings = { 
          exists: false, 
          error: error instanceof Error ? error.message : 'Unknown error',
          status: 'error'
        }
      }
    }

    // 4. Storage buckets check
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
            status: missingBuckets.length === 0 ? 'ok' : 'partial',
            buckets: Array.from(existingBuckets),
            missing: missingBuckets,
            required: requiredBuckets
          }
        }
      } catch (error) {
        results.storage = { 
          status: 'error',
          error: error instanceof Error ? error.message : 'Unknown error'
        }
      }
    }

    // 5. Overall status
    const hasErrors = Object.values(results).some((result: any) => result.status === 'error')
    const hasMissing = Object.values(results).some((result: any) => 
      result.status === 'missing' || result.status === 'partial'
    )

    const overallStatus = hasErrors ? 'error' : hasMissing ? 'incomplete' : 'ok'

    return NextResponse.json({
      success: overallStatus !== 'error',
      status: overallStatus,
      results,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error("Error in database diagnostics:", error)
    return NextResponse.json(
      {
        success: false,
        status: 'error',
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    )
  }
}