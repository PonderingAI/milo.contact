import { NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase-server"

export async function POST(request: Request) {
  try {
    const supabase = createAdminClient()
    const { sql } = await request.json()

    if (!sql) {
      return NextResponse.json(
        {
          error: "SQL query is required",
        },
        { status: 400 },
      )
    }

    // Try to execute SQL directly first
    try {
      const { data, error } = await supabase.rpc("exec_sql", { sql_query: sql })

      if (error) {
        // If exec_sql function doesn't exist, try alternative approach
        if (error.message.includes("function") && error.message.includes("does not exist")) {
          // Try to execute common SQL patterns directly
          const sqlLower = sql.toLowerCase().trim()
          
          if (sqlLower.startsWith('create table')) {
            // For CREATE TABLE, we can use raw SQL through a workaround
            const { error: rawError } = await supabase.from('_dummy_').select('*').limit(0)
            
            return NextResponse.json(
              {
                error: "Direct SQL execution not available",
                details: "Please create the exec_sql function first or use the Supabase SQL Editor",
                sql: `
-- To enable SQL execution, please run this in your Supabase SQL Editor:
CREATE OR REPLACE FUNCTION exec_sql(sql_query text) 
RETURNS void 
LANGUAGE plpgsql 
SECURITY DEFINER 
AS $$ 
BEGIN 
  EXECUTE sql_query; 
END; 
$$;

GRANT EXECUTE ON FUNCTION exec_sql(text) TO authenticated;
GRANT EXECUTE ON FUNCTION exec_sql(text) TO service_role;

-- Then run your original SQL:
${sql}
                `.trim(),
              },
              { status: 422 },
            )
          }
          
          return NextResponse.json(
            {
              error: "The exec_sql function does not exist in your database",
              details: "You need to create this function first. Please run the following SQL in your database:",
              sql: `
CREATE OR REPLACE FUNCTION exec_sql(sql_query text) 
RETURNS void 
LANGUAGE plpgsql 
SECURITY DEFINER 
AS $$ 
BEGIN 
  EXECUTE sql_query; 
END; 
$$;

GRANT EXECUTE ON FUNCTION exec_sql(text) TO authenticated;
GRANT EXECUTE ON FUNCTION exec_sql(text) TO service_role;
              `.trim(),
            },
            { status: 422 },
          )
        }

        return NextResponse.json(
          {
            error: "Failed to execute SQL",
            details: error.message,
          },
          { status: 500 },
        )
      }

      return NextResponse.json({
        success: true,
        message: "SQL executed successfully",
        data
      })
    } catch (execError) {
      console.error("Error executing SQL:", execError)
      
      return NextResponse.json(
        {
          error: "Failed to execute SQL",
          details: execError instanceof Error ? execError.message : String(execError),
          suggestion: "Please run the SQL manually in your Supabase SQL Editor"
        },
        { status: 500 },
      )
    }
  } catch (error) {
    console.error("Error in execute-sql API:", error)
    return NextResponse.json(
      {
        error: "An unexpected error occurred",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    )
  }
}
