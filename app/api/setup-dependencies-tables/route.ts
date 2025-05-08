import { NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase-server"
import fs from "fs"
import path from "path"

export async function POST() {
  try {
    const supabase = createAdminClient()

    // Read the SQL files
    const dependenciesTableSql = fs.readFileSync(
      path.join(process.cwd(), "setup/create-dependencies-table.sql"),
      "utf8",
    )

    const dependencySettingsTableSql = fs.readFileSync(
      path.join(process.cwd(), "setup/create-dependency-settings-table.sql"),
      "utf8",
    )

    const securityAuditsTableSql = fs.readFileSync(
      path.join(process.cwd(), "setup/create-security-audits-table.sql"),
      "utf8",
    )

    // Execute the SQL to create tables
    const { error: depsError } = await supabase.rpc("run_sql", { sql: dependenciesTableSql })
    if (depsError) {
      console.error("Error creating dependencies table:", depsError)
    }

    const { error: settingsError } = await supabase.rpc("run_sql", { sql: dependencySettingsTableSql })
    if (settingsError) {
      console.error("Error creating dependency settings table:", settingsError)
    }

    const { error: auditsError } = await supabase.rpc("run_sql", { sql: securityAuditsTableSql })
    if (auditsError) {
      console.error("Error creating security audits table:", auditsError)
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
