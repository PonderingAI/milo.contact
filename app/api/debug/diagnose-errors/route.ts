import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

export async function GET() {
  const diagnostics: Record<string, any> = {
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || "unknown",
    supabase: {
      url: process.env.NEXT_PUBLIC_SUPABASE_URL ? "configured" : "missing",
      anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? "configured" : "missing",
      serviceRole: process.env.SUPABASE_SERVICE_ROLE_KEY ? "configured" : "missing",
    },
    endpoints: {},
    database: {
      connection: "unknown",
      tables: [],
      errors: [],
    },
  }

  // Test Supabase connection
  try {
    if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
      const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
        },
      })

      // Test connection with a simple query
      const { data, error } = await supabase.from("pg_tables").select("tablename").limit(1)

      if (error) {
        diagnostics.database.connection = "error"
        diagnostics.database.errors.push({
          source: "connection_test",
          message: error.message,
          code: error.code,
        })
      } else {
        diagnostics.database.connection = "success"
      }

      // Try to list tables
      try {
        const { data: tables, error: tablesError } = await supabase
          .from("pg_tables")
          .select("tablename")
          .eq("schemaname", "public")

        if (tablesError) {
          diagnostics.database.errors.push({
            source: "list_tables",
            message: tablesError.message,
            code: tablesError.code,
          })
        } else if (tables) {
          diagnostics.database.tables = tables.map((t) => t.tablename)
        }
      } catch (e) {
        diagnostics.database.errors.push({
          source: "list_tables_exception",
          message: e instanceof Error ? e.message : String(e),
        })
      }

      // Try direct SQL query as a fallback
      if (diagnostics.database.tables.length === 0) {
        try {
          const { data: sqlTables, error: sqlError } = await supabase.rpc("exec_sql", {
            sql_query: `
              SELECT tablename FROM pg_tables 
              WHERE schemaname = 'public'
              ORDER BY tablename;
            `,
          })

          if (sqlError) {
            diagnostics.database.errors.push({
              source: "exec_sql",
              message: sqlError.message,
              code: sqlError.code,
            })
          } else if (sqlTables) {
            diagnostics.database.tables = sqlTables.map((row: any) => row.tablename)
          }
        } catch (e) {
          diagnostics.database.errors.push({
            source: "exec_sql_exception",
            message: e instanceof Error ? e.message : String(e),
          })
        }
      }
    } else {
      diagnostics.database.connection = "not_configured"
      diagnostics.database.errors.push({
        source: "configuration",
        message: "Supabase URL or service role key is missing",
      })
    }
  } catch (e) {
    diagnostics.database.connection = "exception"
    diagnostics.database.errors.push({
      source: "connection_exception",
      message: e instanceof Error ? e.message : String(e),
    })
  }

  // Test API endpoints
  const endpoints = [
    "/api/list-all-tables",
    "/api/check-database-setup",
    "/api/test-supabase-connection",
    "/api/setup-rpc-functions",
  ]

  for (const endpoint of endpoints) {
    try {
      // Use fetch but with a short timeout
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 3000)

      const response = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL || ""}${endpoint}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
        signal: controller.signal,
      })

      clearTimeout(timeoutId)

      diagnostics.endpoints[endpoint] = {
        status: response.status,
        ok: response.ok,
      }

      if (!response.ok) {
        try {
          const errorData = await response.json()
          diagnostics.endpoints[endpoint].error = errorData
        } catch (e) {
          diagnostics.endpoints[endpoint].error = "Could not parse error response"
        }
      }
    } catch (e) {
      diagnostics.endpoints[endpoint] = {
        status: "exception",
        error: e instanceof Error ? e.message : String(e),
      }
    }
  }

  return NextResponse.json(diagnostics)
}
