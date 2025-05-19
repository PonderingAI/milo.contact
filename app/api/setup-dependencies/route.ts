import { NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase-server"
import fs from "fs"
import path from "path"

// Helper function to get package.json
async function getPackageJson() {
  const packageJsonPath = path.join(process.cwd(), "package.json")
  try {
    const packageJsonContent = await fs.promises.readFile(packageJsonPath, "utf8")
    return JSON.parse(packageJsonContent)
  } catch (error) {
    console.error("Error reading package.json:", error)
    throw new Error("Failed to read package.json")
  }
}

export async function POST() {
  try {
    const supabase = createAdminClient()

    // Check if dependencies table exists
    const { data: tableExists, error: checkError } = await supabase.rpc("check_table_exists", {
      table_name: "dependencies",
    })

    if (checkError) {
      console.error("Error checking if dependencies table exists:", checkError)
      return NextResponse.json({ error: "Failed to check if dependencies table exists" }, { status: 500 })
    }

    // Create table if it doesn't exist
    if (!tableExists) {
      const createTableQuery = `
        CREATE TABLE IF NOT EXISTS dependencies (
          id SERIAL PRIMARY KEY,
          name VARCHAR(255) NOT NULL UNIQUE,
          current_version VARCHAR(50) NOT NULL,
          latest_version VARCHAR(50) NOT NULL,
          locked BOOLEAN DEFAULT false,
          description TEXT,
          has_security_issue BOOLEAN DEFAULT false,
          security_details JSONB,
          update_mode VARCHAR(20) DEFAULT 'global',
          is_dev BOOLEAN DEFAULT false,
          last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
      `

      const { error: createError } = await supabase.rpc("run_sql", { sql: createTableQuery })

      if (createError) {
        console.error("Error creating dependencies table:", createError)
        return NextResponse.json({ error: "Failed to create dependencies table" }, { status: 500 })
      }
    }

    // Check if dependency_settings table exists
    const { data: settingsTableExists, error: checkSettingsError } = await supabase.rpc("check_table_exists", {
      table_name: "dependency_settings",
    })

    if (checkSettingsError) {
      console.error("Error checking if dependency_settings table exists:", checkSettingsError)
      return NextResponse.json({ error: "Failed to check if dependency_settings table exists" }, { status: 500 })
    }

    // Create settings table if it doesn't exist
    if (!settingsTableExists) {
      const createSettingsTableQuery = `
        CREATE TABLE IF NOT EXISTS dependency_settings (
          id SERIAL PRIMARY KEY,
          auto_update_enabled BOOLEAN DEFAULT false,
          conservative_mode BOOLEAN DEFAULT true,
          update_mode VARCHAR(20) DEFAULT 'conservative',
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
        
        -- Insert default settings
        INSERT INTO dependency_settings (auto_update_enabled, conservative_mode, update_mode)
        VALUES (false, true, 'conservative')
        ON CONFLICT DO NOTHING;
      `

      const { error: createSettingsError } = await supabase.rpc("run_sql", { sql: createSettingsTableQuery })

      if (createSettingsError) {
        console.error("Error creating dependency_settings table:", createSettingsError)
        return NextResponse.json({ error: "Failed to create dependency_settings table" }, { status: 500 })
      }
    }

    // Get package.json dependencies
    let packageJson
    try {
      packageJson = await getPackageJson()
    } catch (error) {
      console.error("Error reading package.json:", error)
      return NextResponse.json({ error: "Failed to read package.json" }, { status: 500 })
    }

    // Prepare dependencies for insertion
    const dependencies = []

    // Process regular dependencies
    if (packageJson.dependencies) {
      for (const [name, version] of Object.entries(packageJson.dependencies)) {
        dependencies.push({
          name,
          current_version: version.toString().replace(/^\^|~/, ""),
          latest_version: version.toString().replace(/^\^|~/, ""),
          is_dev: false,
          update_mode: "global",
        })
      }
    }

    // Process dev dependencies
    if (packageJson.devDependencies) {
      for (const [name, version] of Object.entries(packageJson.devDependencies)) {
        dependencies.push({
          name,
          current_version: version.toString().replace(/^\^|~/, ""),
          latest_version: version.toString().replace(/^\^|~/, ""),
          is_dev: true,
          update_mode: "global",
        })
      }
    }

    // Insert dependencies into the database
    for (const dep of dependencies) {
      const { error: insertError } = await supabase.from("dependencies").upsert(dep, { onConflict: "name" })

      if (insertError) {
        console.error(`Error inserting dependency ${dep.name}:`, insertError)
      }
    }

    return NextResponse.json({
      success: true,
      message: "Dependencies tables set up successfully",
      dependenciesCount: dependencies.length,
    })
  } catch (error) {
    console.error("Error in setup dependencies API:", error)
    return NextResponse.json(
      {
        error: "Failed to set up dependencies",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    )
  }
}
