import { createServerClient } from "@/lib/supabase"
import { NextResponse } from "next/server"

export async function POST() {
  try {
    const supabase = createServerClient()

    // Create projects table
    const { error: projectsError } = await supabase.rpc("exec_sql", {
      sql_query: `
        CREATE TABLE IF NOT EXISTS projects (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          title TEXT NOT NULL,
          category TEXT NOT NULL,
          type TEXT NOT NULL,
          role TEXT NOT NULL,
          image TEXT NOT NULL,
          video_url TEXT,
          description TEXT,
          special_notes TEXT,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
      `,
    })

    if (projectsError) {
      return NextResponse.json(
        { success: false, message: `Error creating projects table: ${projectsError.message}` },
        { status: 500 },
      )
    }

    // Create BTS images table
    const { error: btsError } = await supabase.rpc("exec_sql", {
      sql_query: `
        CREATE TABLE IF NOT EXISTS bts_images (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        CREATE TABLE IF NOT EXISTS bts_images (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
          image_url TEXT NOT NULL,
          caption TEXT,
          size TEXT,
          aspect_ratio TEXT,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
      `,
    })

    if (btsError) {
      return NextResponse.json(
        { success: false, message: `Error creating BTS images table: ${btsError.message}` },
        { status: 500 },
      )
    }

    return NextResponse.json({ success: true, message: "Database tables created successfully" })
  } catch (error) {
    console.error("Error setting up database:", error)
    return NextResponse.json(
      {
        success: false,
        message: `Error setting up database: ${error instanceof Error ? error.message : String(error)}`,
      },
      { status: 500 },
    )
  }
}
