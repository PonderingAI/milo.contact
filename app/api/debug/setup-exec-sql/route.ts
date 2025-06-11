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

    // Try to create the exec_sql function
    const { data: createResult, error: createError } = await supabase.rpc("exec_sql", {
      sql_query: `
        CREATE OR REPLACE FUNCTION exec_sql(sql_query text)
        RETURNS SETOF json AS $$
        BEGIN
          RETURN QUERY EXECUTE sql_query;
        END;
        $$ LANGUAGE plpgsql SECURITY DEFINER;
      `,
    })

    if (createError) {
      // Function doesn't exist yet, so we need to create it directly
      try {
        const { data: directResult, error: directError } = await supabase.rpc("exec_sql", {
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
          // Try one more approach - direct SQL
          const { data: rawResult, error: rawError } = await supabase.from("_exec_sql_direct").rpc("exec_sql", {
            sql_query: `
              CREATE OR REPLACE FUNCTION exec_sql(sql_query text)
              RETURNS SETOF json AS $$
              BEGIN
                RETURN QUERY EXECUTE sql_query;
              END;
              $$ LANGUAGE plpgsql SECURITY DEFINER;
            `,
          })

          if (rawError) {
            return NextResponse.json(
              {
                success: false,
                error: "Failed to create exec_sql function",
                details: {
                  createError,
                  directError,
                  rawError,
                },
              },
              { status: 500 },
            )
          }
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

    // Test the function
    try {
      const { data: testResult, error: testError } = await supabase.rpc("exec_sql", {
        sql_query: "SELECT 1 as test",
      })

      if (testError) {
        return NextResponse.json(
          {
            success: false,
            error: "exec_sql function exists but failed test",
            details: testError,
          },
          { status: 500 },
        )
      }

      return NextResponse.json({
        success: true,
        message: "exec_sql function is set up and working",
        test: testResult,
      })
    } catch (error) {
      return NextResponse.json(
        {
          success: false,
          error: "Exception testing exec_sql function",
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
