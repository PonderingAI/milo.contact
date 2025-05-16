import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

export async function GET() {
  try {
    // Check environment variables
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      return NextResponse.json({ success: false, error: "Missing Supabase environment variables" }, { status: 500 })
    }

    // Create a Supabase client
    const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    })

    // First, make sure exec_sql exists
    const { data: execSqlResult, error: execSqlError } = await supabase.rpc("exec_sql", {
      sql_query: `
        CREATE OR REPLACE FUNCTION exec_sql(sql_query text)
        RETURNS SETOF json AS $$
        BEGIN
          RETURN QUERY EXECUTE sql_query;
        END;
        $$ LANGUAGE plpgsql SECURITY DEFINER;
      `,
    })

    if (execSqlError) {
      return NextResponse.json(
        {
          success: false,
          error: "Failed to ensure exec_sql function exists",
          details: execSqlError,
        },
        { status: 500 },
      )
    }

    // Now create the list_tables function
    const { data: createResult, error: createError } = await supabase.rpc("exec_sql", {
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
        $$ LANGUAGE plpgsql SECURITY DEFINER;
      `,
    })

    if (createError) {
      return NextResponse.json(
        {
          success: false,
          error: "Failed to create list_tables function",
          details: createError,
        },
        { status: 500 },
      )
    }

    // Test the function
    try {
      const { data: testResult, error: testError } = await supabase.rpc("list_tables")

      if (testError) {
        return NextResponse.json(
          {
            success: false,
            error: "list_tables function exists but failed test",
            details: testError,
          },
          { status: 500 },
        )
      }

      return NextResponse.json({
        success: true,
        message: "list_tables function is set up and working",
        tables: testResult,
      })
    } catch (error) {
      return NextResponse.json(
        {
          success: false,
          error: "Exception testing list_tables function",
          details: error instanceof Error ? error.message : String(error),
        },
        { status: 500 },
      )
    }
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: "Unexpected error",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    )
  }
}
