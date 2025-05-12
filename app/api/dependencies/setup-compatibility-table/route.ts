import { NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase-server"
import fs from "fs"
import path from "path"

export async function POST() {
  try {
    const supabase = createAdminClient()

    // Read the SQL file
    const sqlPath = path.join(process.cwd(), "docs/setup/dependency-compatibility-table.sql")
    const sql = fs.readFileSync(sqlPath, "utf8")

    // Execute the SQL
    const { error } = await supabase.rpc("exec_sql", { sql_query: sql })

    if (error) {
      console.error("Error setting up dependency compatibility table:", error)

      // If the function doesn't exist, return a helpful error
      if (error.message.includes("function") && error.message.includes("does not exist")) {
        return NextResponse.json(
          {
            error: "The exec_sql function does not exist in your database",
            details:
              "You need to create this function first. Please run the setup-database endpoint or use the universal SQL popup.",
          },
          { status: 500 },
        )
      }

      return NextResponse.json(
        {
          error: "Failed to set up dependency compatibility table",
          details: error.message,
        },
        { status: 500 },
      )
    }

    return NextResponse.json({
      success: true,
      message: "Dependency compatibility table set up successfully",
    })
  } catch (error) {
    console.error("Error in setup-compatibility-table API:", error)
    return NextResponse.json(
      {
        error: "An unexpected error occurred",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    )
  }
}
