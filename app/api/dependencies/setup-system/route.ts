import { NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase-server"
import fs from "fs"
import path from "path"

// Helper function to check if tables exist
async function checkTablesExist(supabase) {
  try {
    // Check if the dependencies table exists
    const { data: dependenciesTable, error: depError } = await supabase
      .from("information_schema.tables")
      .select("table_name")
      .eq("table_schema", "public")
      .eq("table_name", "dependencies")
      .single()

    if (depError) {
      console.error("Error checking dependencies table:", depError)
    }

    // Check if the dependency_settings table exists
    const { data: settingsTable, error: settingsError } = await supabase
      .from("information_schema.tables")
      .select("table_name")
      .eq("table_schema", "public")
      .eq("table_name", "dependency_settings")
      .single()

    if (settingsError) {
      console.error("Error checking dependency_settings table:", settingsError)
    }

    // Check if the security_audits table exists
    const { data: auditsTable, error: auditsError } = await supabase
      .from("information_schema.tables")
      .select("table_name")
      .eq("table_schema", "public")
      .eq("table_name", "security_audits")
      .single()

    if (auditsError) {
      console.error("Error checking security_audits table:", auditsError)
    }

    return {
      dependenciesTableExists: !!dependenciesTable,
      settingsTableExists: !!settingsTable,
      auditsTableExists: !!auditsTable,
      allTablesExist: !!dependenciesTable && !!settingsTable && !!auditsTable,
    }
  } catch (error) {
    console.error("Error checking tables:", error)
    return {
      dependenciesTableExists: false,
      settingsTableExists: false,
      auditsTableExists: false,
      allTablesExist: false,
    }
  }
}

// Helper function to get dependencies from package.json
async function getDependenciesFromPackageJson() {
  try {
    // Try to read package.json directly from the file system
    const packageJsonPath = path.join(process.cwd(), "package.json")
    const packageJsonContent = fs.readFileSync(packageJsonPath, "utf8")
    const packageJson = JSON.parse(packageJsonContent)

    return {
      dependencies: Object.entries(packageJson.dependencies || {}).map(([name, version]) => ({
        name,
        current_version: version.toString().replace(/^\^|~/, ""),
        is_dev: false,
      })),
      devDependencies: Object.entries(packageJson.devDependencies || {}).map(([name, version]) => ({
        name,
        current_version: version.toString().replace(/^\^|~/, ""),
        is_dev: true,
      })),
    }
  } catch (error) {
    console.error("Error reading package.json:", error)
    return { dependencies: [], devDependencies: [] }
  }
}

// Create tables if they don't exist
async function createTables(supabase) {
  try {
    // Create dependencies table
    const { error: depError } = await supabase.rpc("execute_sql", {
      sql_query: `
        CREATE TABLE IF NOT EXISTS dependencies (
          id SERIAL PRIMARY KEY,
          name VARCHAR(255) NOT NULL,
          current_version VARCHAR(50),
          latest_version VARCHAR(50),
          outdated BOOLEAN DEFAULT FALSE,
          locked BOOLEAN DEFAULT FALSE,
          has_security_issue BOOLEAN DEFAULT FALSE,
          security_details JSONB,
          description TEXT,
          update_mode VARCHAR(50) DEFAULT 'global',
          is_dev BOOLEAN DEFAULT FALSE,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
      `,
    })

    if (depError) {
      console.error("Error creating dependencies table:", depError)
      throw new Error(`Failed to create dependencies table: ${depError.message}`)
    }

    // Create dependency_settings table
    const { error: settingsError } = await supabase.rpc("execute_sql", {
      sql_query: `
        CREATE TABLE IF NOT EXISTS dependency_settings (
          id SERIAL PRIMARY KEY,
          key VARCHAR(255) NOT NULL,
          value TEXT,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
      `,
    })

    if (settingsError) {
      console.error("Error creating dependency_settings table:", settingsError)
      throw new Error(`Failed to create dependency_settings table: ${settingsError.message}`)
    }

    // Create security_audits table
    const { error: auditsError } = await supabase.rpc("execute_sql", {
      sql_query: `
        CREATE TABLE IF NOT EXISTS security_audits (
          id SERIAL PRIMARY KEY,
          scan_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          vulnerabilities_found INTEGER DEFAULT 0,
          packages_scanned INTEGER DEFAULT 0,
          scan_results JSONB,
          scan_type VARCHAR(50) DEFAULT 'manual'
        );
      `,
    })

    if (auditsError) {
      console.error("Error creating security_audits table:", auditsError)
      throw new Error(`Failed to create security_audits table: ${auditsError.message}`)
    }

    return true
  } catch (error) {
    console.error("Error creating tables:", error)
    throw error
  }
}

// Initialize settings
async function initializeSettings(supabase) {
  try {
    // Check if update_mode setting exists
    const { data: existingSettings, error: checkError } = await supabase
      .from("dependency_settings")
      .select("*")
      .eq("key", "update_mode")

    if (checkError) {
      console.error("Error checking settings:", checkError)
      throw new Error(`Failed to check settings: ${checkError.message}`)
    }

    // If setting doesn't exist, create it
    if (!existingSettings || existingSettings.length === 0) {
      const { error: insertError } = await supabase.from("dependency_settings").insert({
        key: "update_mode",
        value: JSON.stringify("conservative"),
      })

      if (insertError) {
        console.error("Error inserting settings:", insertError)
        throw new Error(`Failed to insert settings: ${insertError.message}`)
      }
    }

    return true
  } catch (error) {
    console.error("Error initializing settings:", error)
    throw error
  }
}

// Populate dependencies from package.json
async function populateDependencies(supabase) {
  try {
    // Check if dependencies table is empty
    const { count, error: countError } = await supabase.from("dependencies").select("*", { count: "exact", head: true })

    if (countError) {
      console.error("Error counting dependencies:", countError)
      throw new Error(`Failed to count dependencies: ${countError.message}`)
    }

    // If table is not empty, skip
    if (count && count > 0) {
      return { skipped: true, message: "Dependencies table already has data" }
    }

    // Get dependencies from package.json
    const { dependencies, devDependencies } = await getDependenciesFromPackageJson()
    const allDeps = [...dependencies, ...devDependencies]

    if (allDeps.length === 0) {
      return { skipped: true, message: "No dependencies found in package.json" }
    }

    // Insert dependencies
    const { error: insertError } = await supabase.from("dependencies").insert(
      allDeps.map((dep) => ({
        name: dep.name,
        current_version: dep.current_version,
        latest_version: dep.current_version, // Set same as current initially
        is_dev: dep.is_dev,
        description: `Imported from package.json`,
      })),
    )

    if (insertError) {
      console.error("Error inserting dependencies:", insertError)
      throw new Error(`Failed to insert dependencies: ${insertError.message}`)
    }

    return {
      success: true,
      count: allDeps.length,
      message: `Imported ${allDeps.length} dependencies from package.json`,
    }
  } catch (error) {
    console.error("Error populating dependencies:", error)
    throw error
  }
}

export async function POST() {
  try {
    const supabase = createAdminClient()

    // Check if tables exist
    const { allTablesExist, dependenciesTableExists, settingsTableExists, auditsTableExists } =
      await checkTablesExist(supabase)

    // Create tables if they don't exist
    if (!allTablesExist) {
      await createTables(supabase)
    }

    // Initialize settings
    if (allTablesExist || settingsTableExists) {
      await initializeSettings(supabase)
    }

    // Populate dependencies
    let populateResult = { skipped: true, message: "Skipped dependency population" }
    if (allTablesExist || dependenciesTableExists) {
      populateResult = await populateDependencies(supabase)
    }

    return NextResponse.json({
      success: true,
      tablesExisted: allTablesExist,
      tablesCreated: !allTablesExist,
      dependencies: populateResult,
      message: "Dependency system setup complete",
    })
  } catch (error) {
    console.error("Error in setup-system API:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Failed to set up dependency system",
        message: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    )
  }
}
