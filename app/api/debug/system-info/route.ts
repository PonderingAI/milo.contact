import { createAdminClient, getSupabaseBrowserClient } from "@/lib/supabase"
import { NextResponse } from "next/server"

export async function GET() {
  try {
    // Check environment variables needed for role system
    const hasSupabaseUrl = !!process.env.NEXT_PUBLIC_SUPABASE_URL
    const hasServiceRoleKey = !!process.env.SUPABASE_SERVICE_ROLE_KEY
    const hasClerkConfig = !!(process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY && process.env.CLERK_SECRET_KEY)
    
    let supabaseInfo = {
      connected: false,
      error: undefined as string | undefined,
      tables: undefined as string[] | undefined,
      version: undefined as string | undefined,
    }

    if (hasSupabaseUrl && hasServiceRoleKey) {
      try {
        // Use admin client for better access
        const supabase = createAdminClient()
        
        // Check connection by listing tables using information_schema
        const { data, error } = await supabase
          .from("information_schema.tables")
          .select("table_name")
          .eq("table_schema", "public")
          .limit(20)

        if (error) {
          // Fallback to pg_catalog if information_schema fails
          console.log("information_schema failed, trying pg_catalog:", error)
          
          const { data: fallbackData, error: fallbackError } = await supabase
            .rpc('exec_sql', {
              sql_query: `
                SELECT tablename as table_name 
                FROM pg_catalog.pg_tables 
                WHERE schemaname = 'public' 
                LIMIT 20;
              `
            })

          if (fallbackError) {
            throw new Error(`Both table listing methods failed: ${error.message} / ${fallbackError.message}`)
          }

          supabaseInfo = {
            connected: true,
            tables: fallbackData?.map((row: any) => row.table_name) || [],
            version: "Available (fallback method used)",
            error: undefined,
          }
        } else {
          supabaseInfo = {
            connected: true,
            tables: data?.map((row) => row.table_name) || [],
            version: "Available",
            error: undefined,
          }
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
        error: "Missing Supabase URL or service role key",
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
