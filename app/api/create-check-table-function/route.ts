import { NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase-server"
import fs from "fs"
import path from "path"

export async function GET() {
  try {
    const supabase = createAdminClient()

    // Read the SQL file
    const sqlFilePath = path.join(process.cwd(), "setup", "create-check-table-exists-function.sql")
    const sql = fs.readFileSync(sqlFilePath, "utf8")

    // Execute the SQL
    const { error } = await supabase.rpc("exec_sql", { sql })

    if (error) {
      // If the exec_sql RPC doesn't exist, we need to create it first
      if (error.message.includes("function exec_sql") && error.message.includes("does not exist")) {
        // Create the exec_sql function first
        const { error: createExecError } = await supabase.rpc("exec", {
          sql: `
            CREATE OR REPLACE FUNCTION exec_sql(sql text) 
            RETURNS void 
            LANGUAGE plpgsql 
            SECURITY DEFINER 
            AS $$ 
            BEGIN 
              EXECUTE sql; 
            END; 
            $$;
            
            GRANT EXECUTE ON FUNCTION exec_sql(text) TO authenticated;
            GRANT EXECUTE ON FUNCTION exec_sql(text) TO service_role;
          `,
        })

        if (createExecError) {
          // If we can't create the exec_sql function, try direct SQL execution
          const { error: directError } = await supabase.from("_direct_sql_execution").rpc("sql", {
            query: sql,
          })

          if (directError) {
            console.error("Failed to create check_table_exists function:", directError)
            return NextResponse.json(
              {
                error: "Failed to create check_table_exists function",
                details: directError.message,
              },
              { status: 500 },
            )
          }
        } else {
          // Now try to create the check_table_exists function
          const { error: retryError } = await supabase.rpc("exec_sql", { sql })

          if (retryError) {
            console.error("Failed to create check_table_exists function:", retryError)
            return NextResponse.json(
              {
                error: "Failed to create check_table_exists function",
                details: retryError.message,
              },
              { status: 500 },
            )
          }
        }
      } else {
        console.error("Failed to create check_table_exists function:", error)
        return NextResponse.json(
          {
            error: "Failed to create check_table_exists function",
            details: error.message,
          },
          { status: 500 },
        )
      }
    }

    return NextResponse.json({
      success: true,
      message: "check_table_exists function created successfully",
    })
  } catch (error) {
    console.error("Error creating check_table_exists function:", error)
    return NextResponse.json(
      {
        error: "An unexpected error occurred",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    )
  }
}
