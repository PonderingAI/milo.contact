import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { NextResponse } from "next/server"
import fs from "fs"
import path from "path"

export const dynamic = "force-dynamic"

export async function POST() {
  try {
    // Create a Supabase client
    const supabase = createRouteHandlerClient({ cookies })

    // Read the SQL file
    const sqlFilePath = path.join(process.cwd(), "docs/setup/dependency-compatibility-table.sql")
    let sql = ""

    try {
      sql = fs.readFileSync(sqlFilePath, "utf8")
    } catch (error) {
      console.error("Error reading SQL file:", error)
      return NextResponse.json({ error: "Could not read SQL file. Please check if the file exists." }, { status: 500 })
    }

    // Execute the SQL
    const { error } = await supabase.rpc("exec_sql", { sql_query: sql })

    if (error) {
      console.error("Error executing SQL:", error)
      return NextResponse.json(
        { error: "Failed to create dependency compatibility table: " + error.message },
        { status: 500 },
      )
    }

    // Update dependency settings to use aggressive mode by default
    const { error: settingsError } = await supabase.from("dependency_settings").upsert(
      {
        id: 1,
        update_mode: "aggressive",
        auto_update_enabled: true,
        update_schedule: "daily",
        updated_at: new Date().toISOString(),
      },
      { onConflict: "id" },
    )

    if (settingsError) {
      console.error("Error updating dependency settings:", settingsError)
      // Continue anyway since the table was created successfully
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Unexpected error:", error)
    return NextResponse.json(
      { error: "An unexpected error occurred: " + (error instanceof Error ? error.message : String(error)) },
      { status: 500 },
    )
  }
}
