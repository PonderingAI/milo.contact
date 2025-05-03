import { createServerClient } from "@/lib/supabase-server"
import { NextResponse } from "next/server"

export async function GET() {
  try {
    const supabase = createServerClient()

    // Create a function to check if a table exists
    const { error } = await supabase.rpc("exec_sql", {
      sql: `
        CREATE OR REPLACE FUNCTION public.check_table_exists(table_name text)
        RETURNS boolean
        LANGUAGE plpgsql
        AS $$
        DECLARE
          exists_bool boolean;
        BEGIN
          SELECT EXISTS (
            SELECT FROM information_schema.tables 
            WHERE table_schema = 'public'
            AND table_name = $1
          ) INTO exists_bool;
          
          RETURN exists_bool;
        END;
        $$;
      `,
    })

    if (error) {
      console.error("Error creating check_table_exists function:", error)
      return NextResponse.json({ error: "Failed to create function" }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error in create-check-table-function route:", error)
    return NextResponse.json({ error: "Failed to create function" }, { status: 500 })
  }
}
