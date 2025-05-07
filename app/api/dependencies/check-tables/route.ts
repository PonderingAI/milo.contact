import { NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase-server"

export async function GET() {
  try {
    const supabase = createAdminClient()

    // Check if dependencies table exists
    const { data: depsTableExists, error: depsError } = await supabase.rpc("check_table_exists", {
      table_name: "dependencies",
    })

    if (depsError) {
      console.error("Error checking dependencies table:", depsError)

      // Try to create the check_table_exists function if it doesn't exist
      try {
        const createFunctionSql = `
          CREATE OR REPLACE FUNCTION check_table_exists(table_name TEXT)
          RETURNS BOOLEAN AS $$
          DECLARE
            exists_bool BOOLEAN;
          BEGIN
            SELECT EXISTS (
              SELECT FROM information_schema.tables 
              WHERE table_schema = 'public' 
              AND table_name = table_name
            ) INTO exists_bool;
            
            RETURN exists_bool;
          END;
          $$ LANGUAGE plpgsql;
        `

        await supabase.rpc("run_sql", { sql: createFunctionSql })

        // Try again after creating the function
        const { data: retryDepsExists, error: retryDepsError } = await supabase.rpc("check_table_exists", {
          table_name: "dependencies",
        })

        if (retryDepsError) {
          return NextResponse.json(
            {
              error: "Failed to check if dependencies table exists",
              details: retryDepsError.message,
              tables: { dependencies: false, dependency_settings: false },
              success: false,
            },
            { status: 200 }, // Return 200 to avoid triggering error handling
          )
        }

        // Use the retry result
        const depsTableExists = retryDepsExists
      } catch (createFunctionError) {
        console.error("Error creating check_table_exists function:", createFunctionError)
        return NextResponse.json(
          {
            error: "Failed to check if tables exist",
            details: createFunctionError instanceof Error ? createFunctionError.message : String(createFunctionError),
            tables: { dependencies: false, dependency_settings: false },
            success: false,
          },
          { status: 200 }, // Return 200 to avoid triggering error handling
        )
      }
    }

    // Check if dependency_settings table exists
    const { data: settingsTableExists, error: settingsError } = await supabase.rpc("check_table_exists", {
      table_name: "dependency_settings",
    })

    if (settingsError) {
      console.error("Error checking dependency_settings table:", settingsError)
      return NextResponse.json(
        {
          error: "Failed to check if dependency_settings table exists",
          details: settingsError.message,
          tables: { dependencies: !!depsTableExists, dependency_settings: false },
          success: false,
        },
        { status: 200 }, // Return 200 to avoid triggering error handling
      )
    }

    return NextResponse.json({
      success: true,
      tables: {
        dependencies: !!depsTableExists,
        dependency_settings: !!settingsTableExists,
      },
    })
  } catch (error) {
    console.error("Error checking tables:", error)
    return NextResponse.json(
      {
        error: "Failed to check tables",
        details: error instanceof Error ? error.message : String(error),
        tables: { dependencies: false, dependency_settings: false },
        success: false,
      },
      { status: 200 }, // Return 200 to avoid triggering error handling
    )
  }
}
