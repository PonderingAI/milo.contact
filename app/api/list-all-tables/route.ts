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

    // Method 1: Query information_schema
    try {
      const { data: schemaTables, error: schemaError } = await supabase
        .from("information_schema.tables")
        .select("table_name")
        .eq("table_schema", "public")
        .order("table_name")

      if (!schemaError && schemaTables) {
        return NextResponse.json({
          success: true,
          method: "information_schema",
          tables: schemaTables.map((t) => t.table_name),
          count: schemaTables.length,
        })
      }
    } catch (error) {
      console.warn("Method 1 failed:", error)
    }

    // Method 2: Try a direct SQL query
    try {
      const { data: sqlTables, error: sqlError } = await supabase.rpc("list_tables")

      if (!sqlError && sqlTables) {
        return NextResponse.json({
          success: true,
          method: "rpc",
          tables: sqlTables,
          count: sqlTables.length,
        })
      }
    } catch (error) {
      console.warn("Method 2 failed:", error)
    }

    // Method 3: Try to create the function and then use it
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
      const { data: createdTables, error: createdError } = await supabase.rpc("list_tables")

      if (!createdError && createdTables) {
        return NextResponse.json({
          success: true,
          method: "created_rpc",
          tables: createdTables,
          count: createdTables.length,
        })
      }
    } catch (error) {
      console.warn("Method 3 failed:", error)
    }

    // If all methods failed, return an error
    return NextResponse.json(
      {
        success: false,
        error: "All methods to list tables failed",
        tables: [],
        count: 0,
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
