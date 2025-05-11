import { NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase-server"
import fs from "fs"
import path from "path"

export async function POST() {
  try {
    const supabase = createAdminClient()

    // Read the SQL file
    const sqlFilePath = path.join(process.cwd(), "docs", "setup", "dependency-tables.sql")
    let sqlContent: string

    try {
      sqlContent = fs.readFileSync(sqlFilePath, "utf8")
    } catch (readError) {
      console.error("Error reading SQL file:", readError)
      return NextResponse.json(
        {
          success: false,
          error: "Failed to read SQL file",
          details: readError instanceof Error ? readError.message : String(readError),
        },
        { status: 500 },
      )
    }

    // Execute the SQL
    const { error } = await supabase.rpc("exec_sql", {
      sql_query: sqlContent,
    })

    if (error) {
      console.error("Error executing SQL:", error)
      return NextResponse.json(
        {
          success: false,
          error: "Failed to execute SQL",
          details: error.message,
        },
        { status: 500 },
      )
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
