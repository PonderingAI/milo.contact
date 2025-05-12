import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

export async function GET() {
  try {
    // Check environment variables
    const envCheck = {
      NEXT_PUBLIC_SUPABASE_URL: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      SUPABASE_SERVICE_ROLE_KEY: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
      SUPABASE_ANON_KEY: !!process.env.SUPABASE_ANON_KEY,
      NEXT_PUBLIC_SUPABASE_ANON_KEY: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    }

    // Get the actual values (first few characters only for security)
    const envValues = {
      NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL?.substring(0, 10) + "...",
      SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY ? "exists (not shown)" : "missing",
      SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY ? "exists (not shown)" : "missing",
      NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? "exists (not shown)" : "missing",
    }

    // Try to create a Supabase client directly
    let directClientTest = "Not tested"
    let directClientError = null

    try {
      if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
        const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
          auth: {
            persistSession: false,
            autoRefreshToken: false,
          },
        })

        // Try a simple query
        const { data, error } = await supabase
          .from("pg_catalog.pg_tables")
          .select("tablename")
          .eq("schemaname", "public")
          .limit(1)

        if (error) {
          throw error
        }

        directClientTest = "Success"
      } else {
        directClientTest = "Skipped due to missing environment variables"
      }
    } catch (error) {
      directClientTest = "Failed"
      directClientError = error instanceof Error ? error.message : "Unknown error"
    }

    // Try to create a client with anon key
    let anonClientTest = "Not tested"
    let anonClientError = null

    try {
      if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
        const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY, {
          auth: {
            persistSession: false,
            autoRefreshToken: false,
          },
        })

        // Try a simple query
        const { data, error } = await supabase
          .from("pg_catalog.pg_tables")
          .select("tablename")
          .eq("schemaname", "public")
          .limit(1)

        if (error) {
          throw error
        }

        anonClientTest = "Success"
      } else {
        anonClientTest = "Skipped due to missing environment variables"
      }
    } catch (error) {
      anonClientTest = "Failed"
      anonClientError = error instanceof Error ? error.message : "Unknown error"
    }

    // Try a direct PostgreSQL connection if possible
    let pgTest = "Not tested"
    let pgError = null

    try {
      pgTest = "Skipped - no direct PostgreSQL connection available in this environment"
    } catch (error) {
      pgTest = "Failed"
      pgError = error instanceof Error ? error.message : "Unknown error"
    }

    return NextResponse.json({
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV,
      environmentVariables: {
        check: envCheck,
        values: envValues,
      },
      tests: {
        directClient: {
          status: directClientTest,
          error: directClientError,
        },
        anonClient: {
          status: anonClientTest,
          error: anonClientError,
        },
        postgresqlDirect: {
          status: pgTest,
          error: pgError,
        },
      },
    })
  } catch (error) {
    console.error("Diagnostic error:", error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
        stack: error instanceof Error ? error.stack : undefined,
      },
      { status: 500 },
    )
  }
}
