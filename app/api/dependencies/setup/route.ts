import { NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase-server"

// Helper function to check if a table exists
async function checkTableExists(supabase, tableName) {
  try {
    const { data, error } = await supabase
      .from("information_schema.tables")
      .select("table_name")
      .eq("table_schema", "public")
      .eq("table_name", tableName)
      .single()

    if (error) {
      console.error(`Error checking if ${tableName} exists:`, error)
      return false
    }

    return !!data
  } catch (error) {
    console.error(`Error in checkTableExists for ${tableName}:`, error)
    return false
  }
}

export async function POST() {
  try {
    const supabase = createAdminClient()

    // Check if dependencies table already exists
    const tableExists = await checkTableExists(supabase, "dependencies")

    if (tableExists) {
      return NextResponse.json({
        message: "Dependencies table already exists. No setup needed.",
        tableExists: true,
      })
    }

    // Create dependencies table
    const { error: createTableError } = await supabase.rpc("execute_sql", {
      sql_query: `
        CREATE TABLE IF NOT EXISTS dependencies (
          id SERIAL PRIMARY KEY,
          name VARCHAR(255) NOT NULL,
          current_version VARCHAR(100) NOT NULL,
          latest_version VARCHAR(100),
          outdated BOOLEAN DEFAULT FALSE,
          locked BOOLEAN DEFAULT FALSE,
          locked_version VARCHAR(100),
          has_security_issue BOOLEAN DEFAULT FALSE,
          security_details JSONB,
          update_mode VARCHAR(50) DEFAULT 'global',
          is_dev BOOLEAN DEFAULT FALSE,
          description TEXT,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
        
        CREATE INDEX IF NOT EXISTS idx_dependencies_name ON dependencies(name);
      `,
    })

    if (createTableError) {
      console.error("Error creating dependencies table:", createTableError)
      return NextResponse.json(
        {
          error: "Failed to create dependencies table",
          message: "There was an error creating the dependencies table.",
          details: createTableError.message,
        },
        { status: 500 },
      )
    }

    // Create dependency settings table
    const { error: createSettingsTableError } = await supabase.rpc("execute_sql", {
      sql_query: `
        CREATE TABLE IF NOT EXISTS dependency_settings (
          id SERIAL PRIMARY KEY,
          key VARCHAR(255) NOT NULL UNIQUE,
          value JSONB,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
        
        -- Insert default settings
        INSERT INTO dependency_settings (key, value)
        VALUES ('update_mode', '"conservative"')
        ON CONFLICT (key) DO NOTHING;
      `,
    })

    if (createSettingsTableError) {
      console.error("Error creating dependency settings table:", createSettingsTableError)
      return NextResponse.json(
        {
          error: "Failed to create dependency settings table",
          message: "There was an error creating the dependency settings table.",
          details: createSettingsTableError.message,
        },
        { status: 500 },
      )
    }

    // Create security audits table
    const { error: createAuditsTableError } = await supabase.rpc("execute_sql", {
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

    if (createAuditsTableError) {
      console.error("Error creating security audits table:", createAuditsTableError)
      return NextResponse.json(
        {
          error: "Failed to create security audits table",
          message: "There was an error creating the security audits table.",
          details: createAuditsTableError.message,
        },
        { status: 500 },
      )
    }

    return NextResponse.json({
      message: "Dependency system set up successfully. Please scan dependencies to populate the database.",
      tableExists: true,
      setupComplete: true,
    })
  } catch (error) {
    console.error("Error in setup API:", error)
    return NextResponse.json(
      {
        error: "An unexpected error occurred",
        message: "There was an unexpected error setting up the dependency system.",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    )
  }
}
