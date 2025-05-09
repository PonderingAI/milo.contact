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
      return await fallbackTableCheck(supabase, tableName)
    }

    return !!data
  } catch (error) {
    console.error(`Error in checkTableExists for ${tableName}:`, error)
    return await fallbackTableCheck(supabase, tableName)
  }
}

// Fallback method to check if a table exists
async function fallbackTableCheck(supabase, tableName) {
  try {
    const { error } = await supabase.from(tableName).select("*").limit(1)
    return !error
  } catch (error) {
    console.error(`Fallback check failed for ${tableName}:`, error)
    return false
  }
}

export async function POST(request: Request) {
  try {
    const supabase = createAdminClient()

    // Check which tables already exist
    const depsTableExists = await checkTableExists(supabase, "dependencies")
    const settingsTableExists = await checkTableExists(supabase, "dependency_settings")
    const securityAuditsTableExists = await checkTableExists(supabase, "security_audits")

    // Determine which tables need to be created
    const tablesToCreate = []
    if (!depsTableExists) tablesToCreate.push("dependencies")
    if (!settingsTableExists) tablesToCreate.push("dependency_settings")
    if (!securityAuditsTableExists) tablesToCreate.push("security_audits")

    // If all tables exist, return early
    if (tablesToCreate.length === 0) {
      return NextResponse.json({
        success: true,
        message: "All dependency tables already exist. No setup needed.",
        tablesCreated: [],
      })
    }

    // Create only the missing tables
    const createdTables = []
    const errors = []

    // Create dependencies table if needed
    if (!depsTableExists) {
      const dependenciesSQL = `
        CREATE TABLE IF NOT EXISTS dependencies (
          id SERIAL PRIMARY KEY,
          name VARCHAR(255) NOT NULL UNIQUE,
          current_version VARCHAR(100) NOT NULL,
          latest_version VARCHAR(100),
          locked BOOLEAN DEFAULT FALSE,
          locked_version VARCHAR(100),
          update_mode VARCHAR(50) DEFAULT 'global', -- 'manual', 'auto', 'conservative', 'global'
          last_checked TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          has_security_update BOOLEAN DEFAULT FALSE,
          is_dev BOOLEAN DEFAULT FALSE,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
        
        -- Add RLS policies
        ALTER TABLE dependencies ENABLE ROW LEVEL SECURITY;
        
        -- Allow authenticated users to read dependencies
        CREATE POLICY IF NOT EXISTS "Allow authenticated users to read dependencies"
        ON dependencies
        FOR SELECT
        TO authenticated
        USING (true);
        
        -- Allow authenticated users with admin role to manage dependencies
        CREATE POLICY IF NOT EXISTS "Allow admins to manage dependencies"
        ON dependencies
        FOR ALL
        TO authenticated
        USING (
          EXISTS (
            SELECT 1 FROM auth.users
            WHERE auth.users.id = auth.uid()
            AND auth.users.role = 'admin'
          )
        );
      `

      try {
        const { error } = await supabase.rpc("run_sql", { sql: dependenciesSQL })
        if (error) {
          errors.push({ table: "dependencies", error: error.message })
        } else {
          createdTables.push("dependencies")
        }
      } catch (err) {
        errors.push({
          table: "dependencies",
          error: err instanceof Error ? err.message : String(err),
        })
      }
    }

    // Create dependency_settings table if needed
    if (!settingsTableExists) {
      const settingsSQL = `
        -- Create dependency settings table
        CREATE TABLE IF NOT EXISTS dependency_settings (
          id SERIAL PRIMARY KEY,
          update_mode VARCHAR(50) DEFAULT 'conservative', -- 'manual', 'auto', 'conservative'
          auto_update_enabled BOOLEAN DEFAULT FALSE,
          update_schedule VARCHAR(100) DEFAULT 'daily',
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
        
        -- Insert default settings
        INSERT INTO dependency_settings (update_mode, auto_update_enabled, update_schedule)
        VALUES ('conservative', FALSE, 'daily')
        ON CONFLICT DO NOTHING;
        
        -- Add RLS policies
        ALTER TABLE dependency_settings ENABLE ROW LEVEL SECURITY;
        
        -- Allow authenticated users to read dependency settings
        CREATE POLICY IF NOT EXISTS "Allow authenticated users to read dependency settings"
        ON dependency_settings
        FOR SELECT
        TO authenticated
        USING (true);
        
        -- Allow authenticated users with admin role to manage dependency settings
        CREATE POLICY IF NOT EXISTS "Allow admins to manage dependency settings"
        ON dependency_settings
        FOR ALL
        TO authenticated
        USING (
          EXISTS (
            SELECT 1 FROM auth.users
            WHERE auth.users.id = auth.uid()
            AND auth.users.role = 'admin'
          )
        );
      `

      try {
        const { error } = await supabase.rpc("run_sql", { sql: settingsSQL })
        if (error) {
          errors.push({ table: "dependency_settings", error: error.message })
        } else {
          createdTables.push("dependency_settings")
        }
      } catch (err) {
        errors.push({
          table: "dependency_settings",
          error: err instanceof Error ? err.message : String(err),
        })
      }
    }

    // Create security_audits table if needed
    if (!securityAuditsTableExists) {
      const auditsSQL = `
        -- Create security audits table
        CREATE TABLE IF NOT EXISTS security_audits (
          id SERIAL PRIMARY KEY,
          audit_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          vulnerabilities_found INTEGER DEFAULT 0,
          packages_scanned INTEGER DEFAULT 0,
          security_score INTEGER DEFAULT 100,
          audit_summary JSONB,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
        
        -- Add RLS policies
        ALTER TABLE security_audits ENABLE ROW LEVEL SECURITY;
        
        -- Allow authenticated users to read security audits
        CREATE POLICY IF NOT EXISTS "Allow authenticated users to read security audits"
        ON security_audits
        FOR SELECT
        TO authenticated
        USING (true);
        
        -- Allow authenticated users with admin role to manage security audits
        CREATE POLICY IF NOT EXISTS "Allow admins to manage security audits"
        ON security_audits
        FOR ALL
        TO authenticated
        USING (
          EXISTS (
            SELECT 1 FROM auth.users
            WHERE auth.users.id = auth.uid()
            AND auth.users.role = 'admin'
          )
        );
      `

      try {
        const { error } = await supabase.rpc("run_sql", { sql: auditsSQL })
        if (error) {
          errors.push({ table: "security_audits", error: error.message })
        } else {
          createdTables.push("security_audits")
        }
      } catch (err) {
        errors.push({
          table: "security_audits",
          error: err instanceof Error ? err.message : String(err),
        })
      }
    }

    // Determine if the operation was successful
    const success = errors.length === 0 || createdTables.length > 0

    // Create a response message
    let message = ""
    if (createdTables.length > 0) {
      message = `Successfully created the following tables: ${createdTables.join(", ")}.`
      if (errors.length > 0) {
        message += ` However, there were errors creating: ${errors.map((e) => e.table).join(", ")}.`
      }
    } else if (errors.length > 0) {
      message = `Failed to create any tables. Errors occurred with: ${errors.map((e) => e.table).join(", ")}.`
    }

    return NextResponse.json({
      success,
      message,
      tablesCreated: createdTables,
      errors: errors.length > 0 ? errors : null,
    })
  } catch (error) {
    console.error("Error in setup-dependencies-tables API:", error)
    return NextResponse.json(
      {
        success: false,
        error: "An unexpected error occurred",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    )
  }
}
