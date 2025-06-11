import { NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase"

export async function GET() {
  try {
    // Check environment variables
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      return NextResponse.json({ success: false, error: "Missing Supabase environment variables" }, { status: 500 })
    }

    // Use the singleton admin client
    const supabase = createAdminClient()

    // Use a simpler approach to list tables without RPC functions
    const { data: tables, error: tablesError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .order('table_name')

    if (tablesError) {
      // Fallback: try a direct query approach
      console.log("information_schema approach failed, trying direct query:", tablesError)
      
      const { data: fallbackTables, error: fallbackError } = await supabase
        .rpc('exec_sql', {
          sql_query: `
            SELECT tablename as table_name 
            FROM pg_catalog.pg_tables 
            WHERE schemaname = 'public' 
            ORDER BY tablename;
          `
        })

      if (fallbackError) {
        return NextResponse.json({
          success: false,
          error: "Failed to list tables using both information_schema and pg_catalog",
          details: { 
            primaryError: tablesError,
            fallbackError: fallbackError
          },
        }, { status: 500 })
      }

      return NextResponse.json({
        success: true,
        message: "Tables listed successfully (using fallback method)",
        tables: fallbackTables,
        method: "pg_catalog_fallback"
      })
    }

    return NextResponse.json({
      success: true,
      message: "Tables listed successfully",
      tables: tables,
      method: "information_schema"
    })
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: "Unexpected error",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    )
  }
}
