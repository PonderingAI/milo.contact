import { NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase-server"

export async function POST() {
  try {
    const supabase = createAdminClient()

    // Check if dependencies table exists
    const { data: dependenciesExists, error: dependenciesCheckError } = await supabase.rpc("check_table_exists", {
      table_name: "dependencies",
    })

    if (dependenciesCheckError) {
      console.error("Error checking if dependencies table exists:", dependenciesCheckError)
      return NextResponse.json(
        {
          success: false,
          error: "Error checking if dependencies table exists",
          details: dependenciesCheckError.message,
        },
        { status: 500 },
      )
    }

    // Create dependencies table if it doesn't exist
    if (!dependenciesExists) {
      const { error: createDependenciesError } = await supabase.rpc("execute_sql", {
        sql_query: `
          CREATE TABLE IF NOT EXISTS dependencies (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            name VARCHAR(255) NOT NULL,
            current_version VARCHAR(100) NOT NULL,
            latest_version VARCHAR(100),
            outdated BOOLEAN DEFAULT FALSE,
            locked BOOLEAN DEFAULT FALSE,
            locked_version VARCHAR(100),
            has_security_update BOOLEAN DEFAULT FALSE,
            security_details JSONB,
            update_mode VARCHAR(50) DEFAULT 'global',
            description TEXT,
            is_dev BOOLEAN DEFAULT FALSE,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
          );
          CREATE INDEX IF NOT EXISTS idx_dependencies_name ON dependencies(name);
        `,
      })

      if (createDependenciesError) {
        console.error("Error creating dependencies table:", createDependenciesError)
        return NextResponse.json(
          {
            success: false,
            error: "Error creating dependencies table",
            details: createDependenciesError.message,
          },
          { status: 500 },
        )
      }
    }

    // Check if dependency_settings table exists
    const { data: settingsExists, error: settingsCheckError } = await supabase.rpc("check_table_exists", {
      table_name: "dependency_settings",
    })

    if (settingsCheckError) {
      console.error("Error checking if dependency_settings table exists:", settingsCheckError)
      return NextResponse.json(
        {
          success: false,
          error: "Error checking if dependency_settings table exists",
          details: settingsCheckError.message,
        },
        { status: 500 },
      )
    }

    // Create dependency_settings table if it doesn't exist
    if (!settingsExists) {
      const { error: createSettingsError } = await supabase.rpc("execute_sql", {
        sql_query: `
          CREATE TABLE IF NOT EXISTS dependency_settings (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            update_mode VARCHAR(50) DEFAULT 'conservative',
            auto_update_enabled BOOLEAN DEFAULT TRUE,
            auto_update_schedule VARCHAR(50) DEFAULT 'weekly',
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
          );
          
          -- Insert default settings if table is empty
          INSERT INTO dependency_settings (update_mode, auto_update_enabled, auto_update_schedule)
          SELECT 'conservative', TRUE, 'weekly'
          WHERE NOT EXISTS (SELECT 1 FROM dependency_settings);
        `,
      })

      if (createSettingsError) {
        console.error("Error creating dependency_settings table:", createSettingsError)
        return NextResponse.json(
          {
            success: false,
            error: "Error creating dependency_settings table",
            details: createSettingsError.message,
          },
          { status: 500 },
        )
      }
    }

    // Initialize dependencies from package.json
    const initResponse = await fetch("/api/dependencies/initialize", {
      method: "POST",
    })

    if (!initResponse.ok) {
      console.warn("Warning: Failed to initialize dependencies from package.json")
    }

    return NextResponse.json({
      success: true,
      message: "Dependency tables set up successfully",
    })
  } catch (error) {
    console.error("Error setting up dependency tables:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Error setting up dependency tables",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    )
  }
}
