import { createAdminClient } from "@/lib/supabase-server"
import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    const supabase = createAdminClient()

    // Create the function_exists function if it doesn't exist
    const checkFunctionExistsQuery = `
      CREATE OR REPLACE FUNCTION function_exists(function_name TEXT)
      RETURNS BOOLEAN AS $$
      BEGIN
        RETURN EXISTS (
          SELECT 1 FROM pg_proc p
          JOIN pg_namespace n ON p.pronamespace = n.oid
          WHERE p.proname = function_name
          AND n.nspname = 'public'
        );
      END;
      $$ LANGUAGE plpgsql;
    `

    // Execute the function_exists creation
    const { error: functionExistsError } = await supabase.rpc("exec_sql", { sql: checkFunctionExistsQuery })

    if (functionExistsError) {
      console.error("Error creating function_exists function:", functionExistsError)
      // Continue anyway, as we might already have the function
    }

    // Create the get_all_media function
    const createGetAllMediaQuery = `
      CREATE OR REPLACE FUNCTION get_all_media()
      RETURNS SETOF media AS $$
      BEGIN
        RETURN QUERY SELECT * FROM media ORDER BY created_at DESC;
      END;
      $$ LANGUAGE plpgsql;
    `

    // Execute the get_all_media creation
    const { error: createError } = await supabase.rpc("exec_sql", { sql: createGetAllMediaQuery })

    if (createError) {
      console.error("Error creating get_all_media function:", createError)

      // If exec_sql fails, try direct SQL execution
      const { error: directError } = await supabase.from("_exec_sql").insert({
        sql: createGetAllMediaQuery,
      })

      if (directError) {
        return NextResponse.json(
          {
            success: false,
            error: `Failed to create function: ${directError.message}`,
          },
          { status: 500 },
        )
      }
    }

    return NextResponse.json({
      success: true,
      message: "RPC functions created successfully",
    })
  } catch (error) {
    console.error("Error in RPC setup:", error)
    return NextResponse.json(
      {
        success: false,
        error: `Failed to set up RPC: ${error instanceof Error ? error.message : String(error)}`,
      },
      { status: 500 },
    )
  }
}
