import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

export async function GET() {
  try {
    // Check environment variables
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
      return NextResponse.json(
        { success: false, error: "Missing NEXT_PUBLIC_SUPABASE_URL environment variable" },
        { status: 500 },
      )
    }

    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
      return NextResponse.json(
        { success: false, error: "Missing SUPABASE_SERVICE_ROLE_KEY environment variable" },
        { status: 500 },
      )
    }

    // Create a Supabase client directly
    const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    })

    // Try a simple query to pg_catalog.pg_tables
    try {
      const { data, error } = await supabase
        .from("pg_catalog.pg_tables")
        .select("tablename")
        .eq("schemaname", "public")
        .order("tablename")

      if (error) {
        throw error
      }

      return NextResponse.json({
        success: true,
        method: "pg_catalog",
        tables: data.map((t) => t.tablename),
        count: data.length,
      })
    } catch (error) {
      console.warn("pg_catalog query failed:", error)

      // Try a direct RPC call as fallback
      try {
        const { data, error } = await supabase.rpc("exec_sql", {
          sql_query: `
            SELECT tablename FROM pg_catalog.pg_tables 
            WHERE schemaname = 'public' 
            ORDER BY tablename;
          `,
        })

        if (error) {
          throw error
        }

        return NextResponse.json({
          success: true,
          method: "exec_sql",
          tables: data.map((row: any) => row.tablename),
          count: data.length,
        })
      } catch (rpcError) {
        console.warn("RPC query failed:", rpcError)

        // Last resort: try to get tables using the direct table check method
        try {
          // Get a list of common tables to check
          const commonTables = [
            "user_roles",
            "site_settings",
            "projects",
            "media",
            "bts_images",
            "contact_messages",
            "dependencies",
            "dependency_settings",
            "dependency_compatibility",
            "security_audits",
            "widget_types",
            "user_widgets",
          ]

          const results: Record<string, boolean> = {}
          const existingTables: string[] = []

          for (const table of commonTables) {
            try {
              const { error } = await supabase.from(table).select("*").limit(1)
              const exists = !error
              results[table] = exists
              if (exists) {
                existingTables.push(table)
              }
            } catch (e) {
              results[table] = false
            }
          }

          return NextResponse.json({
            success: true,
            method: "direct_check",
            tables: existingTables,
            count: existingTables.length,
            results,
          })
        } catch (directError) {
          throw directError
        }
      }
    }
  } catch (error) {
    console.error("Error listing tables:", error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
        tables: [],
        count: 0,
      },
      { status: 500 },
    )
  }
}
