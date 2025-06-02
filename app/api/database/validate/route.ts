import { NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase-server"

/**
 * API endpoint to validate database schema
 * Returns detailed information about table status and missing components
 */
export async function GET() {
  try {
    const supabase = createAdminClient()

    // Get all tables in the public schema
    const { data: tables, error: tablesError } = await supabase
      .from("information_schema.tables")
      .select("table_name")
      .eq("table_schema", "public")

    if (tablesError) {
      return NextResponse.json(
        { error: "Failed to fetch table information", details: tablesError.message },
        { status: 500 }
      )
    }

    // Get all columns for existing tables
    const { data: columns, error: columnsError } = await supabase
      .from("information_schema.columns")
      .select("table_name, column_name, data_type, is_nullable, column_default")
      .eq("table_schema", "public")

    if (columnsError) {
      return NextResponse.json(
        { error: "Failed to fetch column information", details: columnsError.message },
        { status: 500 }
      )
    }

    // Get all policies
    const { data: policies, error: policiesError } = await supabase
      .from("pg_policies")
      .select("tablename, policyname, cmd, roles")

    // Policies error is not critical, so we'll continue without them
    if (policiesError) {
      console.warn("Could not fetch policies:", policiesError.message)
    }

    // Get all indexes
    const { data: indexes, error: indexesError } = await supabase
      .from("pg_indexes")
      .select("tablename, indexname, indexdef")
      .eq("schemaname", "public")

    // Indexes error is not critical, so we'll continue without them
    if (indexesError) {
      console.warn("Could not fetch indexes:", indexesError.message)
    }

    return NextResponse.json({
      success: true,
      data: {
        tables: tables?.map(t => t.table_name) || [],
        columns: columns || [],
        policies: policies || [],
        indexes: indexes || []
      }
    })

  } catch (error) {
    console.error("Error in database validation API:", error)
    return NextResponse.json(
      {
        error: "An unexpected error occurred",
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    )
  }
}

/**
 * POST endpoint to run validation checks
 */
export async function POST(request: Request) {
  try {
    const { tableNames } = await request.json()
    
    if (!Array.isArray(tableNames)) {
      return NextResponse.json(
        { error: "tableNames must be an array" },
        { status: 400 }
      )
    }

    const supabase = createAdminClient()
    const results: Record<string, { exists: boolean; error?: string }> = {}

    // Check each table
    for (const tableName of tableNames) {
      try {
        const { error } = await supabase.from(tableName).select("*").limit(1)
        
        if (error && (error.code === "PGRST116" || error.message.includes("does not exist"))) {
          results[tableName] = { exists: false }
        } else if (error) {
          results[tableName] = { exists: false, error: error.message }
        } else {
          results[tableName] = { exists: true }
        }
      } catch (err) {
        results[tableName] = { 
          exists: false, 
          error: err instanceof Error ? err.message : "Unknown error" 
        }
      }
    }

    return NextResponse.json({
      success: true,
      results
    })

  } catch (error) {
    console.error("Error in database validation POST:", error)
    return NextResponse.json(
      {
        error: "An unexpected error occurred",
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    )
  }
}