import { createAdminClient } from "@/lib/supabase-server"
import { NextResponse } from "next/server"

export async function GET(request: Request) {
  try {
    const supabase = createAdminClient()

    // Check if the get_all_media function exists
    const { data: functionExists, error: functionCheckError } = await supabase.rpc("function_exists", {
      function_name: "get_all_media",
    })

    if (functionCheckError) {
      console.error("Error checking function:", functionCheckError)
      return NextResponse.json({ error: "Error checking function existence" }, { status: 500 })
    }

    // If function doesn't exist, create it
    if (!functionExists || !functionExists.exists) {
      const createFunctionQuery = `
        CREATE OR REPLACE FUNCTION get_all_media()
        RETURNS SETOF media AS $$
        BEGIN
          RETURN QUERY SELECT * FROM media ORDER BY created_at DESC;
        END;
        $$ LANGUAGE plpgsql;
      `

      const { error: createError } = await supabase.rpc("exec_sql", { sql: createFunctionQuery })

      if (createError) {
        console.error("Error creating function:", createError)
        return NextResponse.json({ error: "Failed to create function" }, { status: 500 })
      }
    }

    return NextResponse.json({ success: true, message: "RPC functions ready" })
  } catch (error) {
    console.error("Error in RPC setup:", error)
    return NextResponse.json(
      { error: `Failed to set up RPC: ${error instanceof Error ? error.message : String(error)}` },
      { status: 500 },
    )
  }
}
