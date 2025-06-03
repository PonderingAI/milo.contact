import { NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase-server"

/**
 * API endpoint for database testing operations
 */
export async function POST(request: Request) {
  try {
    const { operation, config, sql } = await request.json()

    if (!operation) {
      return NextResponse.json(
        { error: "Operation is required" },
        { status: 400 }
      )
    }

    const supabase = createAdminClient()

    switch (operation) {
      case "create_test_db":
        return await createTestDatabase(supabase, config)
      
      case "execute_sql":
        return await executeSQLDirect(supabase, sql)
      
      case "validate_tables":
        return await validateTables(supabase, config?.tables || [])
      
      case "cleanup":
        return await cleanupTestData(supabase, config)
      
      default:
        return NextResponse.json(
          { error: `Unknown operation: ${operation}` },
          { status: 400 }
        )
    }

  } catch (error) {
    console.error("Error in database testing API:", error)
    return NextResponse.json(
      {
        error: "An unexpected error occurred",
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    )
  }
}

async function createTestDatabase(supabase: any, config: any) {
  if (!config || !config.tables) {
    return NextResponse.json(
      { error: "Config with tables array is required" },
      { status: 400 }
    )
  }

  try {
    // This would typically execute the SQL through the existing execute-sql endpoint
    // For now, we'll return a success response with the configuration
    return NextResponse.json({
      success: true,
      message: "Test database creation initiated",
      config,
      tablesRequested: config.tables.length
    })

  } catch (error) {
    return NextResponse.json(
      {
        error: "Failed to create test database",
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    )
  }
}

async function executeSQLDirect(supabase: any, sql: string) {
  if (!sql) {
    return NextResponse.json(
      { error: "SQL is required" },
      { status: 400 }
    )
  }

  try {
    // Execute SQL using RPC function
    const { data, error } = await supabase.rpc("exec_sql", { sql_query: sql })

    if (error) {
      return NextResponse.json(
        {
          error: "Failed to execute SQL",
          details: error.message
        },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: "SQL executed successfully",
      data
    })

  } catch (error) {
    return NextResponse.json(
      {
        error: "Failed to execute SQL",
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    )
  }
}

async function validateTables(supabase: any, tableNames: string[]) {
  const results: Record<string, boolean> = {}

  for (const tableName of tableNames) {
    try {
      const { error } = await supabase.from(tableName).select("*").limit(1)
      results[tableName] = !error || (error.code !== "PGRST116" && !error.message.includes("does not exist"))
    } catch {
      results[tableName] = false
    }
  }

  return NextResponse.json({
    success: true,
    results,
    summary: {
      total: tableNames.length,
      existing: Object.values(results).filter(Boolean).length,
      missing: Object.values(results).filter(v => !v).length
    }
  })
}

async function cleanupTestData(supabase: any, config: any) {
  if (!config || !config.tables) {
    return NextResponse.json(
      { error: "Config with tables array is required" },
      { status: 400 }
    )
  }

  try {
    const cleanupResults: Record<string, { success: boolean; error?: string }> = {}

    // Clean up test data from each table
    for (const tableName of config.tables) {
      try {
        // Delete recent test data (last hour)
        const { error } = await supabase
          .from(tableName)
          .delete()
          .gte("created_at", new Date(Date.now() - 60 * 60 * 1000).toISOString())

        cleanupResults[tableName] = { success: !error }
        if (error) {
          cleanupResults[tableName].error = error.message
        }
      } catch (err) {
        cleanupResults[tableName] = { 
          success: false, 
          error: err instanceof Error ? err.message : "Unknown error" 
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: "Cleanup completed",
      results: cleanupResults
    })

  } catch (error) {
    return NextResponse.json(
      {
        error: "Failed to cleanup test data",
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    )
  }
}