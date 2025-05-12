import { NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase-server"

export async function POST() {
  try {
    const supabase = createAdminClient()

    // SQL to create the function
    const { error } = await supabase.rpc("exec_sql", {
      sql_query: `
CREATE OR REPLACE FUNCTION exec_sql(sql_query text)
RETURNS jsonb AS $$
DECLARE
  result jsonb;
BEGIN
  EXECUTE sql_query;
  result := '{"success": true}'::jsonb;
  RETURN result;
EXCEPTION WHEN OTHERS THEN
  result := jsonb_build_object(
    'success', false,
    'error', SQLERRM,
    'detail', SQLSTATE
  );
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a function to create the exec_sql function
CREATE OR REPLACE FUNCTION create_exec_sql_function()
RETURNS void AS $$
BEGIN
  -- Function is created by calling this function
  -- This is just a wrapper to make the API cleaner
  NULL;
END;
$$ LANGUAGE plpgsql;
      `,
    })

    if (error) {
      throw error
    }

    return NextResponse.json({
      success: true,
      message: "Function created successfully",
    })
  } catch (error) {
    console.error("Error creating exec_sql function:", error)
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
