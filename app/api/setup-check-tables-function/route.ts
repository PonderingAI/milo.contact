import { NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase-server"

export async function GET() {
  try {
    const supabase = createAdminClient()

    // Create a function to check if tables exist
    const { error } = await supabase.rpc("create_check_tables_function")

    if (error) {
      // If the function already exists, this is fine
      if (error.message.includes("already exists")) {
        return NextResponse.json({
          success: true,
          message: "Function already exists",
        })
      }

      throw error
    }

    return NextResponse.json({
      success: true,
      message: "Function created successfully",
    })
  } catch (error) {
    console.error("Error creating check_tables_exist function:", error)
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}

export async function POST() {
  try {
    const supabase = createAdminClient()

    // SQL to create the function
    const { error } = await supabase.rpc("exec_sql", {
      sql_query: `
CREATE OR REPLACE FUNCTION check_tables_exist(table_names text[])
RETURNS TABLE(table_name text, exists boolean) AS $$
DECLARE
  t text;
BEGIN
  FOREACH t IN ARRAY table_names
  LOOP
    RETURN QUERY
    SELECT 
      t as table_name,
      EXISTS (
        SELECT 1 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = t
      ) as exists;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Create the exec_sql function if it doesn't exist
CREATE OR REPLACE FUNCTION create_check_tables_function()
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
    console.error("Error creating check_tables_exist function:", error)
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
