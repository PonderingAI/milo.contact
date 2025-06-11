import { NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase"

export async function GET() {
  try {
    // Check environment variables
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      return NextResponse.json({ success: false, error: "Missing Supabase environment variables" }, { status: 500 })
    }

    // Use the singleton admin client
    const supabase = createAdminClient()

    // Create the exec_sql function
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

    // If there was an error, try to create it directly
    if (execSqlError) {
      try {
        // Try direct SQL execution
        const { data: directResult, error: directError } = await supabase.from("_direct_sql").rpc("exec_sql", {
          sql_query: `
            CREATE OR REPLACE FUNCTION exec_sql(sql_query text)
            RETURNS SETOF json AS $$
            BEGIN
              RETURN QUERY EXECUTE sql_query;
            END;
            $$ LANGUAGE plpgsql SECURITY DEFINER;
          `,
        })

        if (directError) {
          return NextResponse.json(
            {
              success: false,
              error: "Failed to create exec_sql function",
              details: {
                execSqlError,
                directError,
              },
            },
            { status: 500 },
          )
        }
      } catch (error) {
        return NextResponse.json(
          {
            success: false,
            error: "Exception creating exec_sql function",
            details: error instanceof Error ? error.message : String(error),
          },
          { status: 500 },
        )
      }
    }

    // Create the list_tables function
    const { data: listTablesResult, error: listTablesError } = await supabase.rpc("exec_sql", {
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

    if (listTablesError) {
      return NextResponse.json(
        {
          success: false,
          error: "Failed to create list_tables function",
          details: listTablesError,
        },
        { status: 500 },
      )
    }

    // Create the check_table_exists function
    const { data: checkTableResult, error: checkTableError } = await supabase.rpc("exec_sql", {
      sql_query: `
        CREATE OR REPLACE FUNCTION check_table_exists(table_name text)
        RETURNS boolean AS $$
        DECLARE
          table_exists boolean;
        BEGIN
          SELECT EXISTS (
            SELECT FROM pg_tables
            WHERE schemaname = 'public'
            AND tablename = table_name
          ) INTO table_exists;
          
          RETURN table_exists;
        END;
        $$ LANGUAGE plpgsql SECURITY DEFINER;
      `,
    })

    if (checkTableError) {
      return NextResponse.json(
        {
          success: false,
          error: "Failed to create check_table_exists function",
          details: checkTableError,
        },
        { status: 500 },
      )
    }

    // Create the get_table_row_count function
    const { data: rowCountResult, error: rowCountError } = await supabase.rpc("exec_sql", {
      sql_query: `
        CREATE OR REPLACE FUNCTION get_table_row_count(table_name text)
        RETURNS integer AS $$
        DECLARE
          row_count integer;
          query text;
        BEGIN
          query := 'SELECT COUNT(*) FROM ' || quote_ident(table_name);
          EXECUTE query INTO row_count;
          RETURN row_count;
        END;
        $$ LANGUAGE plpgsql SECURITY DEFINER;
      `,
    })

    if (rowCountError) {
      return NextResponse.json(
        {
          success: false,
          error: "Failed to create get_table_row_count function",
          details: rowCountError,
        },
        { status: 500 },
      )
    }

    return NextResponse.json({
      success: true,
      message: "All RPC functions have been set up successfully",
      functions: ["exec_sql", "list_tables", "check_table_exists", "get_table_row_count"],
    })
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
