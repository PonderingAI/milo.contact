import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase-server"
import { auth } from "@clerk/nextjs/server"

export async function POST(request: Request) {
  try {
    // Check authentication
    const { userId } = auth()
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Connect to Supabase
    const supabase = createClient()

    // Create dependency_settings table
    const { error: settingsError } = await supabase.rpc("execute_sql", {
      sql_query: `
        CREATE TABLE IF NOT EXISTS dependency_settings (
          id SERIAL PRIMARY KEY,
          update_mode VARCHAR(20) DEFAULT 'conservative',
          auto_update BOOLEAN DEFAULT false,
          last_scan TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          last_update TIMESTAMP WITH TIME ZONE,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
      `,
    })

    if (settingsError) {
      console.error("Error creating dependency_settings table:", settingsError)
      return NextResponse.json({ error: "Failed to create dependency_settings table" }, { status: 500 })
    }

    // Create dependencies table
    const { error: dependenciesError } = await supabase.rpc("execute_sql", {
      sql_query: `
        CREATE TABLE IF NOT EXISTS dependencies (
          id SERIAL PRIMARY KEY,
          name VARCHAR(255) NOT NULL,
          current_version VARCHAR(100),
          latest_version VARCHAR(100),
          description TEXT,
          is_dev BOOLEAN DEFAULT false,
          outdated BOOLEAN DEFAULT false,
          locked BOOLEAN DEFAULT false,
          has_security_issue BOOLEAN DEFAULT false,
          security_details JSONB,
          update_mode VARCHAR(20) DEFAULT 'global',
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          UNIQUE(name)
        );
      `,
    })

    if (dependenciesError) {
      console.error("Error creating dependencies table:", dependenciesError)
      return NextResponse.json({ error: "Failed to create dependencies table" }, { status: 500 })
    }

    // Create security_audits table
    const { error: auditsError } = await supabase.rpc("execute_sql", {
      sql_query: `
        CREATE TABLE IF NOT EXISTS security_audits (
          id SERIAL PRIMARY KEY,
          scan_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          vulnerabilities INTEGER DEFAULT 0,
          outdated_packages INTEGER DEFAULT 0,
          security_score INTEGER DEFAULT 100,
          details JSONB,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
      `,
    })

    if (auditsError) {
      console.error("Error creating security_audits table:", auditsError)
      return NextResponse.json({ error: "Failed to create security_audits table" }, { status: 500 })
    }

    // Create dependency_updates table
    const { error: updatesError } = await supabase.rpc("execute_sql", {
      sql_query: `
        CREATE TABLE IF NOT EXISTS dependency_updates (
          id SERIAL PRIMARY KEY,
          dependency_name VARCHAR(255) NOT NULL,
          from_version VARCHAR(100),
          to_version VARCHAR(100),
          update_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          success BOOLEAN DEFAULT true,
          error_message TEXT,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
      `,
    })

    if (updatesError) {
      console.error("Error creating dependency_updates table:", updatesError)
      return NextResponse.json({ error: "Failed to create dependency_updates table" }, { status: 500 })
    }

    // Insert default settings if not exists
    const { error: insertError } = await supabase.rpc("execute_sql", {
      sql_query: `
        INSERT INTO dependency_settings (update_mode, auto_update)
        SELECT 'conservative', false
        WHERE NOT EXISTS (SELECT 1 FROM dependency_settings);
      `,
    })

    if (insertError) {
      console.error("Error inserting default settings:", insertError)
      return NextResponse.json({ error: "Failed to insert default settings" }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: "Dependency system set up successfully",
    })
  } catch (error) {
    console.error("Error in setup API:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
