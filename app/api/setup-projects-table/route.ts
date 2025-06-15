import { NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase-server"

export async function POST() {
  try {
    const supabase = createAdminClient()

    // Check if the projects table exists
    const { data: tableExists, error: tableError } = await supabase.rpc("check_table_exists", {
      table_name: "projects",
    })

    if (tableError) {
      console.error("Error checking if projects table exists:", tableError)
      return NextResponse.json(
        {
          success: false,
          error: tableError.message,
          details: "Failed to check if projects table exists",
        },
        { status: 500 },
      )
    }

    // If the table already exists, return success
    if (tableExists) {
      return NextResponse.json({
        success: true,
        message: "Projects table already exists",
      })
    }

    // Create the projects table
    const { error: createError } = await supabase.rpc("exec_sql", {
      sql_query: `
        -- Enable UUID extension if not already enabled
        CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

        -- Create projects table
        CREATE TABLE IF NOT EXISTS projects (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          title TEXT NOT NULL,
          description TEXT,
          image TEXT NOT NULL,
          category TEXT NOT NULL,
          role TEXT NOT NULL,
          video_url TEXT,
          video_platform TEXT,
          video_id TEXT,
          thumbnail_url TEXT,
          project_date DATE,
          is_public BOOLEAN DEFAULT TRUE,
          publish_date TIMESTAMP WITH TIME ZONE,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );

        -- Add RLS policies
        ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

        -- Allow authenticated users to read projects
        CREATE POLICY "authenticated_read_projects"
        ON projects
        FOR SELECT
        TO authenticated
        USING (true);

        -- Allow authenticated users with admin role to manage projects
        -- NOTE: Admin permission checking now handled at API level (Clerk-only)
        CREATE POLICY "admins_manage_projects"
        ON projects
        FOR ALL
        TO authenticated
        USING (true);

        -- Create BTS images table
        CREATE TABLE IF NOT EXISTS bts_images (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
          image_url TEXT NOT NULL,
          caption TEXT,
          size TEXT,
          aspect_ratio TEXT,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );

        -- Add RLS policies for BTS images
        ALTER TABLE bts_images ENABLE ROW LEVEL SECURITY;

        -- Allow authenticated users to read BTS images
        CREATE POLICY "authenticated_read_bts_images"
        ON bts_images
        FOR SELECT
        TO authenticated
        USING (true);

        -- Allow authenticated users with admin role to manage BTS images
        -- NOTE: Admin permission checking now handled at API level (Clerk-only)
        CREATE POLICY "admins_manage_bts_images"
        ON bts_images
        FOR ALL
        TO authenticated
        USING (true);
      `,
    })

    if (createError) {
      console.error("Error creating projects table:", createError)
      return NextResponse.json(
        {
          success: false,
          error: createError.message,
          details: "Failed to create projects table",
        },
        { status: 500 },
      )
    }

    return NextResponse.json({
      success: true,
      message: "Projects table created successfully",
    })
  } catch (error) {
    console.error("Unexpected error creating projects table:", error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error occurred",
        details: "There was an unexpected error creating the projects table",
      },
      { status: 500 },
    )
  }
}
