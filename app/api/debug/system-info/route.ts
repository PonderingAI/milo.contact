import { createClient } from "@supabase/supabase-js"
import { NextResponse } from "next/server"

export async function GET() {
  try {
    // Create Supabase client
    const supabaseUrl = process.env.SUPABASE_URL || ""
    const supabaseKey = process.env.SUPABASE_ANON_KEY || ""
    const supabase = createClient(supabaseUrl, supabaseKey)

    // Test Supabase connection
    let supabaseInfo = {
      connected: false,
      error: undefined as string | undefined,
      tables: undefined as string[] | undefined,
      version: undefined as string | undefined,
    }

    try {
      // Check connection by listing tables
      const { data, error } = await supabase
        .from("pg_catalog.pg_tables")
        .select("tablename")
        .eq("schemaname", "public")
        .limit(20)

      if (error) {
        throw error
      }

      // Get version info
      const { data: versionData, error: versionError } = await supabase.rpc("version")

      supabaseInfo = {
        connected: true,
        tables: data?.map((row) => row.tablename) || [],
        version: versionError ? undefined : versionData,
        error: undefined,
      }
    } catch (error) {
      supabaseInfo = {
        connected: false,
        error: error instanceof Error ? error.message : String(error),
        tables: undefined,
        version: undefined,
      }
    }

    // Get environment info
    const environmentInfo = {
      nodeVersion: process.version,
      platform: process.platform,
    }

    return NextResponse.json({
      supabase: supabaseInfo,
      environment: environmentInfo,
    })
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : String(error) }, { status: 500 })
  }
}
