import { NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase-server"

export async function GET() {
  try {
    const supabase = createAdminClient()

    // Check if the column exists
    const { data: columnCheck, error: checkError } = await supabase.rpc("exec_sql", {
      sql_query: `
        SELECT column_name
        FROM information_schema.columns
        WHERE table_name = 'projects' AND column_name = 'thumbnail_url';
      `,
    })

    if (checkError) {
      console.error("Error checking for thumbnail_url column:", checkError)
      return NextResponse.json({ error: checkError.message }, { status: 500 })
    }

    // If column doesn't exist, add it
    if (!columnCheck || columnCheck.length === 0) {
      const { data, error } = await supabase.rpc("exec_sql", {
        sql_query: `
          ALTER TABLE projects
          ADD COLUMN thumbnail_url TEXT;
        `,
      })

      if (error) {
        console.error("Error adding thumbnail_url column:", error)
        return NextResponse.json({ error: error.message }, { status: 500 })
      }

      return NextResponse.json({
        success: true,
        message: "Added thumbnail_url column to projects table",
      })
    }

    return NextResponse.json({
      success: true,
      message: "thumbnail_url column already exists",
    })
  } catch (error: any) {
    console.error("Error in add-thumbnail-url-column:", error)
    return NextResponse.json({ error: error.message || "An unknown error occurred" }, { status: 500 })
  }
}
