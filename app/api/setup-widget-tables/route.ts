import { NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase-server"
import fs from "fs"
import path from "path"

export async function POST() {
  try {
    const supabase = createAdminClient()

    // Check if tables already exist
    const { data: widgetTypesExist, error: checkWidgetTypesError } = await supabase
      .from("information_schema.tables")
      .select("table_name")
      .eq("table_schema", "public")
      .eq("table_name", "widget_types")
      .single()

    const { data: userWidgetsExist, error: checkUserWidgetsError } = await supabase
      .from("information_schema.tables")
      .select("table_name")
      .eq("table_schema", "public")
      .eq("table_name", "user_widgets")
      .single()

    // If both tables exist, return early
    if (widgetTypesExist && userWidgetsExist) {
      return NextResponse.json({
        success: true,
        message: "Widget tables already exist",
        tablesExist: true,
      })
    }

    // Read the SQL file
    const sqlPath = path.join(process.cwd(), "setup", "create-widget-tables.sql")
    let sql

    try {
      sql = fs.readFileSync(sqlPath, "utf8")
    } catch (err) {
      console.error("Error reading SQL file:", err)
      return NextResponse.json(
        {
          success: false,
          error: "Failed to read SQL file",
          details: err instanceof Error ? err.message : String(err),
        },
        { status: 500 },
      )
    }

    // Execute the SQL
    const { error } = await supabase.rpc("run_sql", { sql })

    if (error) {
      console.error("Error executing SQL:", error)
      return NextResponse.json(
        {
          success: false,
          error: "Failed to create widget tables",
          details: error.message,
        },
        { status: 500 },
      )
    }

    return NextResponse.json({
      success: true,
      message: "Widget tables created successfully",
    })
  } catch (error) {
    console.error("Error in setup-widget-tables API:", error)
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
