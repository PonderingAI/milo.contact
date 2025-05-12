import { NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase-server"

export async function POST(request: Request) {
  try {
    const { sql } = await request.json()

    if (!sql) {
      return NextResponse.json(
        {
          error: "No SQL provided",
        },
        { status: 400 },
      )
    }

    const supabase = createAdminClient()

    // First, check if the exec_sql function exists
    const { data: functionExists, error: checkError } = await supabase
      .from("information_schema.routines")
      .select("routine_name")
      .eq("routine_schema", "public")
      .eq("routine_name", "exec_sql")
      .single()

    // If the function doesn't exist, create it
    if (checkError || !functionExists) {
      console.log("Creating exec_sql function...")

      // Create the exec_sql function
      const { error: createError } = await supabase.rpc("exec_sql", {
        sql_query: `
          CREATE OR REPLACE FUNCTION exec_sql(sql_query text)
          RETURNS json AS $$
          DECLARE
            result json;
          BEGIN
            EXECUTE sql_query;
            result := json_build_object('success', true);
            RETURN result;
          EXCEPTION WHEN OTHERS THEN
            result := json_build_object(
              'success', false,
              'error', SQLERRM,
              'context', SQLSTATE
            );
            RETURN result;
          END;
          $$ LANGUAGE plpgsql SECURITY DEFINER;
        `,
      })

      if (createError) {
        // If we can't create the function, try direct execution
        console.warn("Failed to create exec_sql function, trying direct execution:", createError)

        // Execute the SQL directly
        const { error: directError } = await supabase.rpc("exec_sql", { sql_query: sql })

        if (directError) {
          throw new Error(`Failed to execute SQL: ${directError.message}`)
        }

        return NextResponse.json({
          success: true,
          message: "SQL executed successfully (direct execution)",
        })
      }

      // If we successfully created the function, continue
    }

    // Execute the SQL using the exec_sql function
    const { data, error } = await supabase.rpc("exec_sql", { sql_query: sql })

    if (error) {
      throw new Error(`Failed to execute SQL: ${error.message}`)
    }

    return NextResponse.json({
      success: true,
      message: "SQL executed successfully",
      result: data,
    })
  } catch (error) {
    console.error("Error in exec-sql:", error)
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
