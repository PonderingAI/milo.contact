import { createAdminClient } from "@/lib/supabase-server"
import { NextResponse } from "next/server"

export async function POST() {
  try {
    const supabase = createAdminClient()

    // Create the media table
    const { error } = await supabase.rpc("exec_sql", {
      sql_query: `
        -- Create extension if it doesn't exist
        CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
        
        -- Create media table if it doesn't exist
        CREATE TABLE IF NOT EXISTS media (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          filename TEXT NOT NULL,
          filepath TEXT NOT NULL,
          filesize BIGINT NOT NULL DEFAULT 0,
          filetype TEXT NOT NULL,
          public_url TEXT NOT NULL,
          thumbnail_url TEXT,
          tags TEXT[] DEFAULT '{}',
          metadata JSONB DEFAULT '{}',
          usage_locations JSONB DEFAULT '{}',
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
        
        -- Add RLS policies
        ALTER TABLE media ENABLE ROW LEVEL SECURITY;
        
        -- Allow public read access
        DO $$
        BEGIN
          IF NOT EXISTS (
            SELECT 1 FROM pg_policies WHERE tablename = 'media' AND policyname = 'public_read_media'
          ) THEN
            CREATE POLICY "public_read_media"
            ON media
            FOR SELECT
            TO public
            USING (true);
          END IF;
        EXCEPTION WHEN OTHERS THEN
          -- Policy already exists or other error
        END $$;
        
        -- Allow authenticated users with admin role to manage media
        DO $$
        BEGIN
          IF NOT EXISTS (
            SELECT 1 FROM pg_policies WHERE tablename = 'media' AND policyname = 'admins_manage_media'
          ) THEN
            CREATE POLICY "admins_manage_media"
            ON media
            FOR ALL
            TO authenticated
            USING (true); -- Admin permission checking now handled at API level (Clerk-only)
          END IF;
        EXCEPTION WHEN OTHERS THEN
          -- Policy already exists or other error
        END $$;
      `,
    })

    if (error) {
      console.error("Error creating media table:", error)
      return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error setting up media table:", error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : String(error) },
      { status: 500 },
    )
  }
}
