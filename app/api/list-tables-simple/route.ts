import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

export async function GET() {
  try {
    // Check environment variables
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
      return NextResponse.json({ error: "Missing NEXT_PUBLIC_SUPABASE_URL environment variable" }, { status: 500 })
    }

    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
      return NextResponse.json({ error: "Missing SUPABASE_SERVICE_ROLE_KEY environment variable" }, { status: 500 })
    }

    // Create a Supabase client directly
    const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    })

    // Try method 1: Query pg_catalog.pg_tables
    try {
      const { data, error } = await supabase.from("pg_catalog.pg_tables").select("tablename").eq("schemaname", "public")

      if (!error && data) {
        const tables = data.map((row) => row.tablename)
        return NextResponse.json({
          success: true,
          method: "pg_catalog",
          tables,
          count: tables.length,
        })
      }
    } catch (error) {
      console.warn("Method 1 failed:", error)
    }

    // Try method 2: Use direct-table-check with common table names
    try {
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

      const response = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL}/api/direct-table-check`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ tables: commonTables }),
      })

      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          return NextResponse.json({
            success: true,
            method: "direct-table-check",
            tables: data.existingTables,
            count: data.existingTables.length,
          })
        }
      }
    } catch (error) {
      console.warn("Method 2 failed:", error)
    }

    // Try method 3: Use a direct SQL query via REST API
    try {
      const query = "SELECT tablename FROM pg_tables WHERE schemaname = 'public'"
      const response = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/?${encodeURIComponent(query)}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          apikey: process.env.SUPABASE_SERVICE_ROLE_KEY!,
          Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
        },
      })

      if (response.ok) {
        const data = await response.json()
        const tables = data.map((row: any) => row.tablename)
        return NextResponse.json({
          success: true,
          method: "direct-sql",
          tables,
          count: tables.length,
        })
      }
    } catch (error) {
      console.warn("Method 3 failed:", error)
    }

    // If all methods fail, return an error
    return NextResponse.json(
      {
        success: false,
        error: "Failed to list tables using all available methods",
      },
      { status: 500 },
    )
  } catch (error) {
    console.error("Error listing tables:", error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
