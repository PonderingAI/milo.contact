import { NextResponse } from "next/server"
import { getRouteHandlerSupabaseClient } from "@/lib/auth-server"
import { auth } from "@clerk/nextjs/server"

export async function POST(request: Request) {
  try {
    // Check if user is authenticated
    const { userId } = auth()
    if (!userId) {
      return NextResponse.json({ 
        error: "Unauthorized", 
        message: "You must be signed in to set up dependency tables" 
      }, { status: 401 })
    }
    
    // Get authenticated Supabase client that syncs Clerk with Supabase
    const supabase = await getRouteHandlerSupabaseClient()
    
    // Check if user has admin role
    const { data: roleData, error: roleError } = await supabase
      .from('user_roles')
      .select('*')
      .eq('user_id', userId)
      .eq('role', 'admin')
    
    if (roleError || !roleData || roleData.length === 0) {
      return NextResponse.json({ 
        error: "Permission denied", 
        message: "Admin role required to set up dependency tables"
      }, { status: 403 })
    }

    // SQL to create the dependencies table
    const createDependenciesTableSQL = `
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
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `

    // SQL to create the dependency settings table
    const createDependencySettingsTableSQL = `
      CREATE TABLE IF NOT EXISTS dependency_settings (
        id SERIAL PRIMARY KEY,
        update_mode VARCHAR(50) DEFAULT 'conservative', -- 'manual', 'auto', 'conservative'
        auto_update_enabled BOOLEAN DEFAULT FALSE,
        update_schedule VARCHAR(100) DEFAULT 'daily',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
      
      -- Insert default settings if not exists
      INSERT INTO dependency_settings (update_mode, auto_update_enabled, update_schedule)
      VALUES ('conservative', FALSE, 'daily')
      ON CONFLICT DO NOTHING;
    `

    // Execute the SQL to create the dependencies table
    const { error: dependenciesTableError } = await supabase.rpc("exec_sql", {
      sql_query: createDependenciesTableSQL,
    })

    if (dependenciesTableError) {
      console.error("Error creating dependencies table:", dependenciesTableError)

      // Try direct SQL execution as fallback
      try {
        const { error: directError } = await supabase.from("_direct_sql_execution").rpc("sql", {
          query: createDependenciesTableSQL,
        })

        if (directError) {
          throw new Error(directError.message)
        }
      } catch (directError) {
        return NextResponse.json(
          {
            success: false,
            error: "Failed to create dependencies table",
            details: dependenciesTableError.message,
            directError: directError instanceof Error ? directError.message : String(directError),
          },
          { status: 500 },
        )
      }
    }

    // Execute the SQL to create the dependency settings table
    const { error: settingsTableError } = await supabase.rpc("exec_sql", {
      sql_query: createDependencySettingsTableSQL,
    })

    if (settingsTableError) {
      console.error("Error creating dependency settings table:", settingsTableError)

      // Try direct SQL execution as fallback
      try {
        const { error: directError } = await supabase.from("_direct_sql_execution").rpc("sql", {
          query: createDependencySettingsTableSQL,
        })

        if (directError) {
          throw new Error(directError.message)
        }
      } catch (directError) {
        return NextResponse.json(
          {
            success: false,
            error: "Failed to create dependency settings table",
            details: settingsTableError.message,
            directError: directError instanceof Error ? directError.message : String(directError),
          },
          { status: 500 },
        )
      }
    }

    return NextResponse.json({
      success: true,
      message: "Dependency tables created successfully",
    })
  } catch (error) {
    console.error("Error setting up dependency tables:", error)
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
