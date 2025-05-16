import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

export async function GET() {
  try {
    // Check environment variables
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
      return NextResponse.json(
        { success: false, error: "Missing NEXT_PUBLIC_SUPABASE_URL environment variable" },
        { status: 500 },
      )
    }

    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
      return NextResponse.json(
        { success: false, error: "Missing SUPABASE_SERVICE_ROLE_KEY environment variable" },
        { status: 500 },
      )
    }

    // Create a Supabase client directly
    const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    })

    // Try different methods to list tables
    let tables = []
    let method = ""
    let error = null

    // Method 1: Query pg_tables directly
    try {
      const { data: pgTables, error: pgError } = await supabase
        .from("pg_tables")
        .select("tablename")
        .eq("schemaname", "public")
        .order("tablename")

      if (!pgError && pgTables && pgTables.length > 0) {
        tables = pgTables.map((t) => t.tablename)
        method = "pg_tables"
        return NextResponse.json({
          success: true,
          method,
          tables,
          count: tables.length,
        })
      } else if (pgError) {
        error = pgError
      }
    } catch (err) {
      console.warn("Method 1 failed:", err)
    }

    // Method 2: Try a direct SQL query
    if (tables.length === 0) {
      try {
        const { data: sqlResult, error: sqlError } = await supabase.rpc("exec_sql", {
          sql_query: `
            SELECT tablename FROM pg_tables 
            WHERE schemaname = 'public'
            ORDER BY tablename;
          `,
        })

        if (!sqlError && sqlResult && sqlResult.length > 0) {
          tables = sqlResult.map((row: any) => row.tablename)
          method = "exec_sql"
          return NextResponse.json({
            success: true,
            method,
            tables,
            count: tables.length,
          })
        } else if (sqlError) {
          error = sqlError
        }
      } catch (err) {
        console.warn("Method 2 failed:", err)
      }
    }

    // Method 3: Try to create the function and then use it
    if (tables.length === 0) {
      try {
        // Create the function first
        await supabase.rpc("exec_sql", {
          sql_query: `
            CREATE OR REPLACE FUNCTION list_tables()
            RETURNS TABLE(table_name text) AS $$
            BEGIN
              RETURN QUERY
              SELECT t.tablename::text
              FROM pg_catalog.pg_tables t
              WHERE t.schemaname = 'public'
              ORDER BY t.tablename;
            END;
            $$ LANGUAGE plpgsql;
          `,
        })

        // Now use the function
        const { data: fnResult, error: fnError } = await supabase.rpc("list_tables")

        if (!fnError && fnResult && fnResult.length > 0) {
          tables = fnResult.map((row: any) => row.table_name || row)
          method = "list_tables_function"
          return NextResponse.json({
            success: true,
            method,
            tables,
            count: tables.length,
          })
        } else if (fnError) {
          error = fnError
        }
      } catch (err) {
        console.warn("Method 3 failed:", err)
      }
    }

    // Method 4: Last resort - try information_schema
    if (tables.length === 0) {
      try {
        const { data: schemaResult, error: schemaError } = await supabase.rpc("exec_sql", {
          sql_query: `
            SELECT table_name 
            FROM information_schema.tables
            WHERE table_schema = 'public'
            ORDER BY table_name;
          `,
        })

        if (!schemaError && schemaResult && schemaResult.length > 0) {
          tables = schemaResult.map((row: any) => row.table_name)
          method = "information_schema"
          return NextResponse.json({
            success: true,
            method,
            tables,
            count: tables.length,
          })
        } else if (schemaError) {
          error = schemaError
        }
      } catch (err) {
        console.warn("Method 4 failed:", err)
      }
    }

    // If all methods failed, return an error
    return NextResponse.json(
      {
        success: false,
        error: error ? `All methods to list tables failed. Last error: ${JSON.stringify(error)}` : "All methods failed",
        tables: [],
        count: 0,
        lastError: error,
      },
      { status: 500 },
    )
  } catch (error) {
    console.error("Error listing tables:", error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
        tables: [],
        count: 0,
      },
      { status: 500 },
    )
  }
}
