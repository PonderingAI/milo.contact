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

    // Execute the SQL directly
    const { data, error } = await supabase.rpc("exec_sql", { sql_query: sql })

    if (error) {
      console.error("Error executing SQL:", error)

      // If the function doesn't exist, return a helpful error
      if (error.message.includes("function") && error.message.includes("does not exist")) {
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
          { status: 500 },
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
    })
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
