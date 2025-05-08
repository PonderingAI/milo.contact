import { createAdminClient } from "./supabase-server"
import fs from "fs"
import path from "path"

export async function setupDependencyTables() {
  try {
    const supabase = createAdminClient()

    // Try multiple methods to create tables
    let success = false

    // Method 1: Use RPC function if it exists
    try {
      const { data, error } = await supabase.rpc("setup_dependency_tables")
      if (!error) {
        console.log("Successfully set up dependency tables using RPC")
        success = true
      }
    } catch (rpcError) {
      console.error("RPC setup_dependency_tables failed:", rpcError)
      // Fall through to next method
    }

    // Method 2: Use SQL files
    if (!success) {
      try {
        // Read SQL files
        const dependenciesSQL = fs.readFileSync(
          path.join(process.cwd(), "setup", "create-dependencies-table.sql"),
          "utf8",
        )

        const settingsSQL = fs.readFileSync(
          path.join(process.cwd(), "setup", "create-dependency-settings-table.sql"),
          "utf8",
        )

        // Execute SQL
        const { error: depsError } = await supabase.rpc("run_sql", { sql: dependenciesSQL })
        if (depsError) {
          console.error("Error creating dependencies table:", depsError)
        }

        const { error: settingsError } = await supabase.rpc("run_sql", { sql: settingsSQL })
        if (settingsError) {
          console.error("Error creating dependency_settings table:", settingsError)
        }

        success = !depsError && !settingsError
        if (success) {
          console.log("Successfully set up dependency tables using SQL files")
        }
      } catch (sqlError) {
        console.error("Error setting up tables using SQL files:", sqlError)
        // Fall through to next method
      }
    }

    // Method 3: Direct SQL queries
    if (!success) {
      try {
        // Create dependencies table
        const createDepsSQL = `
          CREATE TABLE IF NOT EXISTS dependencies (
            id SERIAL PRIMARY KEY,
            name TEXT NOT NULL UNIQUE,
            current_version TEXT NOT NULL,
            latest_version TEXT,
            locked BOOLEAN DEFAULT false,
            locked_version TEXT,
            update_mode TEXT DEFAULT 'global',
            has_security_update BOOLEAN DEFAULT false,
            security_details JSONB,
            outdated BOOLEAN DEFAULT false,
            is_dev BOOLEAN DEFAULT false,
            description TEXT,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
          );
        `

        // Create dependency_settings table
        const createSettingsSQL = `
          CREATE TABLE IF NOT EXISTS dependency_settings (
            id SERIAL PRIMARY KEY,
            update_mode TEXT DEFAULT 'conservative',
            auto_update_enabled BOOLEAN DEFAULT false,
            update_schedule TEXT DEFAULT 'daily',
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
          );
          
          -- Insert default settings if table is empty
          INSERT INTO dependency_settings (update_mode, auto_update_enabled, update_schedule)
          SELECT 'conservative', false, 'daily'
          WHERE NOT EXISTS (SELECT 1 FROM dependency_settings);
        `

        // Execute SQL
        const { error: depsError } = await supabase.rpc("run_sql", { sql: createDepsSQL })
        if (depsError) {
          console.error("Error creating dependencies table with direct SQL:", depsError)
        }

        const { error: settingsError } = await supabase.rpc("run_sql", { sql: createSettingsSQL })
        if (settingsError) {
          console.error("Error creating dependency_settings table with direct SQL:", settingsError)
        }

        success = !depsError && !settingsError
        if (success) {
          console.log("Successfully set up dependency tables using direct SQL")
        }
      } catch (directSqlError) {
        console.error("Error setting up tables using direct SQL:", directSqlError)
      }
    }

    return success
  } catch (error) {
    console.error("Error setting up dependency tables:", error)
    return false
  }
}
