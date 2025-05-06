import { createClient } from "@/lib/supabase-server"
import { NextResponse } from "next/server"
import fs from "fs"
import path from "path"

export async function GET() {
  try {
    const supabase = createClient()

    // Read the SQL file
    const sqlFilePath = path.join(process.cwd(), "setup", "create-dependencies-table.sql")
    let sql

    try {
      sql = fs.readFileSync(sqlFilePath, "utf8")
    } catch (error) {
      console.error("Error reading SQL file:", error)
      return NextResponse.json(
        {
          error: "Failed to read SQL file",
          details: error instanceof Error ? error.message : String(error),
        },
        { status: 500 },
      )
    }

    // Execute the SQL
    const { error } = await supabase.rpc("exec_sql", { sql_query: sql })

    if (error) {
      console.error("Error creating dependencies table:", error)
      return NextResponse.json(
        {
          error: "Failed to create dependencies table",
          details: error.message,
        },
        { status: 500 },
      )
    }

    return NextResponse.json({
      success: true,
      message: "Dependencies table created successfully",
    })
  } catch (error) {
    console.error("Error in setup-dependencies-table:", error)
    return NextResponse.json(
      {
        error: "An unexpected error occurred",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    )
  }
}
