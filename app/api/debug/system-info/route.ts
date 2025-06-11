import { createClient } from "@supabase/supabase-js"
import { NextResponse } from "next/server"

export async function GET() {
  try {
    // Check environment variables needed for role system
    const hasSupabaseUrl = !!process.env.NEXT_PUBLIC_SUPABASE_URL
    const hasServiceRoleKey = !!process.env.SUPABASE_SERVICE_ROLE_KEY
    const hasClerkConfig = !!(process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY && process.env.CLERK_SECRET_KEY)
    
    // Create Supabase client
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || ""
    const supabaseKey = process.env.SUPABASE_ANON_KEY || ""
    
    let supabaseInfo = {
      connected: false,
      error: undefined as string | undefined,
      tables: undefined as string[] | undefined,
      version: undefined as string | undefined,
    }

    if (supabaseUrl && supabaseKey) {
      try {
        const supabase = createClient(supabaseUrl, supabaseKey)
        
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
    } else {
      supabaseInfo = {
        connected: false,
        error: "Missing Supabase URL or anon key",
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
      supabaseUrl: hasSupabaseUrl ? "configured" : "missing",
      hasServiceRoleKey,
      hasClerkConfig,
      requiredEnvVars: {
        NEXT_PUBLIC_SUPABASE_URL: hasSupabaseUrl,
        SUPABASE_SERVICE_ROLE_KEY: hasServiceRoleKey,
        NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: !!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY,
        CLERK_SECRET_KEY: !!process.env.CLERK_SECRET_KEY
      }
    })
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : String(error) }, { status: 500 })
  }
}
