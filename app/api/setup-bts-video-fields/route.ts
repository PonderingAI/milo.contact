import { NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase-server"

export async function POST() {
  try {
    const supabase = createAdminClient()

    // Add video-related fields to bts_images table
    const { error: alterError } = await supabase.rpc("exec_sql", {
      sql_query: `
        -- Add video-related columns to bts_images table if they don't exist
        DO $$ 
        BEGIN
          -- Add is_video column
          IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'bts_images' AND column_name = 'is_video'
          ) THEN
            ALTER TABLE bts_images ADD COLUMN is_video BOOLEAN DEFAULT FALSE;
          END IF;

          -- Add video_url column
          IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'bts_images' AND column_name = 'video_url'
          ) THEN
            ALTER TABLE bts_images ADD COLUMN video_url TEXT;
          END IF;

          -- Add video_platform column
          IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'bts_images' AND column_name = 'video_platform'
          ) THEN
            ALTER TABLE bts_images ADD COLUMN video_platform TEXT;
          END IF;

          -- Add video_id column
          IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'bts_images' AND column_name = 'video_id'
          ) THEN
            ALTER TABLE bts_images ADD COLUMN video_id TEXT;
          END IF;
        END $$;
      `,
    })

    if (alterError) {
      console.error("Error adding video fields to bts_images table:", alterError)
      return NextResponse.json(
        {
          success: false,
          error: alterError.message,
          details: "Failed to add video fields to bts_images table",
        },
        { status: 500 },
      )
    }

    return NextResponse.json({
      success: true,
      message: "Video fields added to bts_images table successfully",
      fields_added: [
        "is_video (BOOLEAN DEFAULT FALSE)",
        "video_url (TEXT)",
        "video_platform (TEXT)",
        "video_id (TEXT)"
      ]
    })
  } catch (error) {
    console.error("Unexpected error:", error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error occurred",
      },
      { status: 500 },
    )
  }
}