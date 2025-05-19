import { createAdminClient } from "@/lib/supabase-server"
import { NextResponse } from "next/server"

export async function POST() {
  try {
    const supabase = createAdminClient()

    // Create the exec_sql function if it doesn't exist
    const { error } = await supabase
      .rpc("exec_sql", {
        sql_query: `
        -- Create the exec_sql function if it doesn't exist
        CREATE OR REPLACE FUNCTION exec_sql(sql_query text)
        RETURNS void
        LANGUAGE plpgsql
        SECURITY DEFINER
        AS $$
        BEGIN
          EXECUTE sql_query;
        END;
        $$;
        
        -- Grant execute permission to authenticated users
        GRANT EXECUTE ON FUNCTION exec_sql(text) TO authenticated;
      `,
      })
      .catch((err) => {
        // If the function doesn't exist, create it
        if (err.message.includes("function exec_sql(text) does not exist")) {
          return supabase
            .from("_rpc")
            .select("*")
            .limit(1)
            .then(() => {
              // This is just a dummy query to get a connection
              // Now execute raw SQL to create the function
              return supabase.rpc("exec_sql", {
                sql_query: `
              -- Create the exec_sql function
              CREATE OR REPLACE FUNCTION exec_sql(sql_query text)
              RETURNS void
              LANGUAGE plpgsql
              SECURITY DEFINER
              AS $$
              BEGIN
                EXECUTE sql_query;
              END;
              $$;
              
              -- Grant execute permission to authenticated users
              GRANT EXECUTE ON FUNCTION exec_sql(text) TO authenticated;
            `,
              })
            })
        }
        throw err
      })

    if (error) {
      console.error("Error creating exec_sql function:", error)
      return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error setting up exec_sql function:", error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : String(error) },
      { status: 500 },
    )
  }
}
