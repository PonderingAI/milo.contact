import { NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase-server"

export async function GET() {
  try {
    const supabase = createAdminClient()

    // Check if the projects table exists
    const { data: tableExists, error: tableError } = await supabase.rpc("check_table_exists", {
      table_name: "projects",
    })

    if (tableError) {
      console.error("Error checking if projects table exists:", tableError)
      return NextResponse.json(
        {
          success: false,
          error: tableError.message,
          details: "Failed to check if projects table exists",
        },
        { status: 500 },
      )
    }

    if (!tableExists) {
      return NextResponse.json(
        {
          success: false,
          error: "Projects table does not exist",
          details: "The projects table does not exist in the database",
        },
        { status: 404 },
      )
    }

    // Get the columns of the projects table
    const { data: columns, error: columnsError } = await supabase.rpc("get_table_columns", {
      table_name: "projects",
    })

    if (columnsError) {
      console.error("Error getting projects table columns:", columnsError)

      // Try a direct query as fallback
      const { data: directData, error: directError } = await supabase.from("projects").select("*").limit(1)

      if (directError) {
        console.error("Error with direct query:", directError)
        return NextResponse.json(
          {
            success: false,
            error: columnsError.message,
            details: "Failed to get projects table columns",
            directError: directError.message,
          },
          { status: 500 },
        )
      }

      // If we got data, extract the columns from the first row
      if (directData && directData.length > 0) {
        const columnNames = Object.keys(directData[0])
        return NextResponse.json({
          success: true,
          columns: columnNames.map((name) => ({ column_name: name })),
          method: "direct_query",
        })
      }

      // If we got no data but no error, the table exists but is empty
      return NextResponse.json({
        success: true,
        columns: [],
        method: "direct_query",
        note: "Table exists but is empty",
      })
    }

    // Create a simple projects table if it doesn't exist
    if (!columns || columns.length === 0) {
      // Execute SQL to create the projects table
      const { error: createError } = await supabase.rpc("exec_sql", {
        sql_query: `
          CREATE TABLE IF NOT EXISTS projects (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            title TEXT NOT NULL,
            description TEXT,
            image TEXT NOT NULL,
            category TEXT NOT NULL,
            role TEXT NOT NULL,
            project_date DATE,
            is_public BOOLEAN DEFAULT TRUE,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
          );
        `,
      })

      if (createError) {
        console.error("Error creating projects table:", createError)
        return NextResponse.json(
          {
            success: false,
            error: createError.message,
            details: "Failed to create projects table",
          },
          { status: 500 },
        )
      }

      return NextResponse.json({
        success: true,
        message: "Projects table created",
        columns: [
          { column_name: "id" },
          { column_name: "title" },
          { column_name: "description" },
          { column_name: "image" },
          { column_name: "category" },
          { column_name: "role" },
          { column_name: "project_date" },
          { column_name: "is_public" },
          { column_name: "created_at" },
          { column_name: "updated_at" },
        ],
      })
    }

    return NextResponse.json({
      success: true,
      columns,
    })
  } catch (error) {
    console.error("Unexpected error checking projects table:", error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error occurred",
        details: "There was an unexpected error checking the projects table",
      },
      { status: 500 },
    )
  }
}
