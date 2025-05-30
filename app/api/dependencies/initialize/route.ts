import { NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase-server"
import fs from "fs"
import path from "path"

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

export async function POST() {
  try {
    const supabase = createAdminClient()

    // Check if tables exist
    const { data: tablesData, error: tablesError } = await supabase
      .from("information_schema.tables")
      .select("table_name")
      .eq("table_schema", "public")
      .in("table_name", ["dependencies", "dependency_settings", "security_audits"])

    if (tablesError) {
      console.error("Error checking tables:", tablesError)
      return NextResponse.json(
        {
          error: "Failed to check tables",
          message: "There was an error checking if the required tables exist.",
          details: tablesError.message,
        },
        { status: 500 },
      )
    }

    // If any tables are missing, return error
    const existingTables = tablesData.map((t) => t.table_name)
    const requiredTables = ["dependencies", "dependency_settings", "security_audits"]
    const missingTables = requiredTables.filter((t) => !existingTables.includes(t))

    if (missingTables.length > 0) {
      return NextResponse.json(
        {
          error: "Missing tables",
          message: "Some required tables are missing. Please set up the tables first.",
          missingTables,
        },
        { status: 400 },
      )
    }

    // Check if dependency_settings has the update_mode setting
    const { data: settingsData, error: settingsError } = await supabase.from("dependency_settings").select("*").limit(1)

    if (settingsError && !settingsError.message.includes("does not exist")) {
      console.error("Error checking settings:", settingsError)
      return NextResponse.json(
        {
          error: "Failed to check settings",
          message: "There was an error checking if the settings exist.",
          details: settingsError.message,
        },
        { status: 500 },
      )
    }

    // If no settings, insert default settings
    if (!settingsData || settingsData.length === 0) {
      // Check which column exists in dependency_settings
      const { data: columnsData, error: columnsError } = await supabase
        .from("information_schema.columns")
        .select("column_name")
        .eq("table_name", "dependency_settings")

      if (columnsError) {
        console.error("Error checking columns:", columnsError)
        return NextResponse.json(
          {
            error: "Failed to check columns",
            message: "There was an error checking the columns in dependency_settings.",
            details: columnsError.message,
          },
          { status: 500 },
        )
      }

      const columns = columnsData.map((c) => c.column_name)
      let keyColumn = "key_name" // Default

      if (columns.includes("key")) {
        keyColumn = "key"
      } else if (columns.includes("setting_key")) {
        keyColumn = "setting_key"
      }

      // Insert default settings
      const { error: insertError } = await supabase.from("dependency_settings").insert({
        [keyColumn]: "update_mode",
        value: '"conservative"',
      })

      if (insertError) {
        console.error("Error inserting settings:", insertError)
        return NextResponse.json(
          {
            error: "Failed to insert settings",
            message: "There was an error inserting the default settings.",
            details: insertError.message,
          },
          { status: 500 },
        )
      }
    }

    // Check if dependencies table has any entries
    const { data: depsData, error: depsError } = await supabase.from("dependencies").select("*").limit(1)

    if (depsError && !depsError.message.includes("does not exist")) {
      console.error("Error checking dependencies:", depsError)
      return NextResponse.json(
        {
          error: "Failed to check dependencies",
          message: "There was an error checking if any dependencies exist.",
          details: depsError.message,
        },
        { status: 500 },
      )
    }

    // If no dependencies, insert from package.json
    if (!depsData || depsData.length === 0) {
      const { dependencies, devDependencies } = await getDependenciesFromPackageJson()
      const allDeps = [...dependencies, ...devDependencies]

      if (allDeps.length > 0) {
        const { error: insertError } = await supabase.from("dependencies").insert(
          allDeps.map((dep) => ({
            name: dep.name,
            current_version: dep.current_version,
            latest_version: dep.current_version, // We don't know the latest version yet
            outdated: false, // We don't know if it's outdated yet
            locked: false,
            has_security_issue: false,
            is_dev: dep.is_dev,
            description: "Loaded from package.json",
            update_mode: "global",
          })),
        )

        if (insertError) {
          console.error("Error inserting dependencies:", insertError)
          return NextResponse.json(
            {
              error: "Failed to insert dependencies",
              message: "There was an error inserting the dependencies from package.json.",
              details: insertError.message,
            },
            { status: 500 },
          )
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: "Dependency system initialized successfully.",
    })
  } catch (error) {
    console.error("Error initializing dependency system:", error)
    return NextResponse.json(
      {
        error: "An unexpected error occurred",
        message: "There was an unexpected error initializing the dependency system.",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    )
  }
}
