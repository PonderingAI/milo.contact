import { NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase-server"

export async function POST() {
  console.log("=== SETTING UP MAIN MEDIA TABLE ===")
  
  try {
    // Use admin client to bypass RLS
    const supabase = createAdminClient()

    // Create main_media table similar to bts_images table
    const createTableSQL = `
      CREATE TABLE IF NOT EXISTS main_media (
        id SERIAL PRIMARY KEY,
        project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
        image_url TEXT NOT NULL,
        caption TEXT,
        is_video BOOLEAN DEFAULT FALSE,
        video_url TEXT,
        video_platform TEXT,
        video_id TEXT,
        display_order INTEGER DEFAULT 0,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `

    const { error: tableError } = await supabase.rpc('exec_sql', { sql: createTableSQL })

    if (tableError) {
      console.error("Error creating main_media table:", tableError)
      return NextResponse.json({
        success: false,
        error: "Failed to create main_media table",
        details: tableError.message
      }, { status: 500 })
    }

    // Create indexes for better performance
    const indexSQL = `
      CREATE INDEX IF NOT EXISTS idx_main_media_project_id ON main_media(project_id);
      CREATE INDEX IF NOT EXISTS idx_main_media_display_order ON main_media(project_id, display_order);
    `

    const { error: indexError } = await supabase.rpc('exec_sql', { sql: indexSQL })

    if (indexError) {
      console.error("Error creating indexes:", indexError)
      // Don't fail on index errors, they're not critical
    }

    // Set up RLS policy for main_media table
    const rlsSQL = `
      ALTER TABLE main_media ENABLE ROW LEVEL SECURITY;
      
      DROP POLICY IF EXISTS "Enable read access for all users" ON main_media;
      CREATE POLICY "Enable read access for all users" ON main_media
        FOR SELECT USING (true);
      
      DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON main_media;
      CREATE POLICY "Enable insert for authenticated users only" ON main_media
        FOR INSERT WITH CHECK (true);
      
      DROP POLICY IF EXISTS "Enable update for authenticated users only" ON main_media;
      CREATE POLICY "Enable update for authenticated users only" ON main_media
        FOR UPDATE USING (true);
      
      DROP POLICY IF EXISTS "Enable delete for authenticated users only" ON main_media;
      CREATE POLICY "Enable delete for authenticated users only" ON main_media
        FOR DELETE USING (true);
    `

    const { error: rlsError } = await supabase.rpc('exec_sql', { sql: rlsSQL })

    if (rlsError) {
      console.error("Error setting up RLS policies:", rlsError)
      // Don't fail on RLS errors, table creation is more important
    }

    return NextResponse.json({
      success: true,
      message: "Main media table created successfully",
      tableCreated: true,
      indexesCreated: !indexError,
      rlsPoliciesCreated: !rlsError
    })

  } catch (error) {
    console.error("Unexpected error setting up main media table:", error)
    return NextResponse.json({
      success: false,
      error: "Unexpected error occurred",
      details: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 })
  }
}