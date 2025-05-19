import { NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase-server"

export async function POST() {
  try {
    const supabase = createAdminClient()

    // Create a function to check if tables exist
    const { error } = await supabase.rpc("exec_sql", {
      sql_query: `
        CREATE OR REPLACE FUNCTION check_tables_exist(table_names text[])
        RETURNS TABLE(table_name text, exists boolean) AS $$
        BEGIN
          RETURN QUERY
          SELECT t.table_name::text, 
                 EXISTS(
                   SELECT 1 
                   FROM information_schema.tables 
                   WHERE table_schema = 'public' 
                   AND table_name = t.table_name
                 ) as exists
          FROM unnest(table_names) AS t(table_name);
        END;
        $$ LANGUAGE plpgsql SECURITY DEFINER;
      `,
    })

    if (error) {
      console.error("Error creating check_tables_exist function:", error)
      return NextResponse.json(
        {
          error: `Failed to create check_tables_exist function: ${error.message}`,
        },
        { status: 500 },
      )
    }

    return NextResponse.json({
      success: true,
      message: "check_tables_exist function created successfully",
    })
  } catch (error) {
    console.error("Error in setup-check-tables-function:", error)
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
