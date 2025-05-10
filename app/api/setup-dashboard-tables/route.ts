import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase-server"

export async function POST() {
  try {
    const supabase = createClient()

    // Create dashboard_states table if it doesn't exist
    const { error: dashboardStatesError } = await supabase.rpc("exec_sql", {
      sql_query: `
        CREATE TABLE IF NOT EXISTS dashboard_states (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          user_id UUID NOT NULL,
          dashboard_id TEXT NOT NULL,
          state JSONB NOT NULL,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          UNIQUE(user_id, dashboard_id)
        );
        
        CREATE INDEX IF NOT EXISTS idx_dashboard_states_user_id ON dashboard_states(user_id);
        CREATE INDEX IF NOT EXISTS idx_dashboard_states_dashboard_id ON dashboard_states(dashboard_id);
      `,
    })

    if (dashboardStatesError) {
      console.error("Error creating dashboard_states table:", dashboardStatesError)
      return NextResponse.json({ error: "Failed to create dashboard_states table" }, { status: 500 })
    }

    // Create user_preferences table if it doesn't exist
    const { error: userPreferencesError } = await supabase.rpc("exec_sql", {
      sql_query: `
        CREATE TABLE IF NOT EXISTS user_preferences (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          user_id UUID NOT NULL UNIQUE,
          update_mode TEXT,
          theme TEXT,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
        
        CREATE INDEX IF NOT EXISTS idx_user_preferences_user_id ON user_preferences(user_id);
      `,
    })

    if (userPreferencesError) {
      console.error("Error creating user_preferences table:", userPreferencesError)
      return NextResponse.json({ error: "Failed to create user_preferences table" }, { status: 500 })
    }

    // Create stored procedures for table creation
    const { error: proceduresError } = await supabase.rpc("exec_sql", {
      sql_query: `
        CREATE OR REPLACE FUNCTION create_dashboard_states_table()
        RETURNS void AS $$
        BEGIN
          CREATE TABLE IF NOT EXISTS dashboard_states (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            user_id UUID NOT NULL,
            dashboard_id TEXT NOT NULL,
            state JSONB NOT NULL,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            UNIQUE(user_id, dashboard_id)
          );
          
          CREATE INDEX IF NOT EXISTS idx_dashboard_states_user_id ON dashboard_states(user_id);
          CREATE INDEX IF NOT EXISTS idx_dashboard_states_dashboard_id ON dashboard_states(dashboard_id);
        END;
        $$ LANGUAGE plpgsql;
        
        CREATE OR REPLACE FUNCTION create_user_preferences_table()
        RETURNS void AS $$
        BEGIN
          CREATE TABLE IF NOT EXISTS user_preferences (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            user_id UUID NOT NULL UNIQUE,
            update_mode TEXT,
            theme TEXT,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
          );
          
          CREATE INDEX IF NOT EXISTS idx_user_preferences_user_id ON user_preferences(user_id);
        END;
        $$ LANGUAGE plpgsql;
      `,
    })

    if (proceduresError) {
      console.error("Error creating stored procedures:", proceduresError)
      return NextResponse.json({ error: "Failed to create stored procedures" }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error setting up dashboard tables:", error)
    return NextResponse.json({ error: "Failed to set up dashboard tables" }, { status: 500 })
  }
}
