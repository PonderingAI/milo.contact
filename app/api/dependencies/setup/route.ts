import { NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase-server"
import fs from "fs"
import path from "path"

export async function POST() {
  try {
    const supabase = createAdminClient()

    // Check if tables already exist
    const { data: exists, error: checkError } = await supabase.rpc("check_dependency_tables_exist")

    if (checkError) {
      // If the function doesn't exist, we need to create the tables
      console.log("Function check_dependency_tables_exist doesn't exist, creating tables...")
    } else if (exists) {
      return NextResponse.json({
        success: true,
        message: "Dependency tables already exist",
        alreadyExists: true,
      })
    }

    // Read the SQL file
    const sqlPath = path.join(process.cwd(), "setup", "create-dependency-system.sql")
    const sql = fs.readFileSync(sqlPath, "utf8")

    // Execute the SQL
    const { error } = await supabase.rpc("run_sql", { sql })

    if (error) {
      console.error("Error executing SQL:", error)
      return NextResponse.json(
        {
          error: "Failed to set up dependency tables",
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
    console.error("Error in setup-dependencies API:", error)
    return NextResponse.json(
      {
        error: "An unexpected error occurred",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    )
  }
}
