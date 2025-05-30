import { createServerClient } from "@/lib/supabase"
import { NextResponse } from "next/server"

export async function GET() {
  try {
    const supabase = createServerClient()

    // Check if the table exists
    const { error: checkError } = await supabase.from("site_settings").select("key").limit(1)

    // If the table doesn't exist, create it
    if (checkError && checkError.message.includes('relation "public.site_settings" does not exist')) {
      const { error: createError } = await supabase.rpc("create_settings_table")

      if (createError) {
        // Try direct SQL if RPC fails
        const { error: sqlError } = await supabase.rpc("execute_sql", {
          sql_query: `
            CREATE TABLE IF NOT EXISTS public.site_settings (
              key TEXT PRIMARY KEY,
              value JSONB NOT NULL,
              created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
              updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
            );
          `,
        })

        if (sqlError) {
          return NextResponse.json({ error: sqlError.message }, { status: 500 })
        }
      }
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error("Error setting up settings table:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
