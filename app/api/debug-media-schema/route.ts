import { createAdminClient } from "@/lib/supabase-server"
import { NextResponse } from "next/server"

export async function GET() {
  try {
    const supabase = createAdminClient()
    
    // Get the actual schema of the media table
    const { data: columns, error: schemaError } = await supabase
      .rpc('exec_sql', {
        sql_query: `
          SELECT column_name, data_type, is_nullable 
          FROM information_schema.columns 
          WHERE table_name = 'media' 
          AND table_schema = 'public'
          ORDER BY ordinal_position;
        `
      })

    if (schemaError) {
      console.error("Error fetching schema:", schemaError)
      return NextResponse.json({ error: schemaError.message }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true, 
      columns: columns,
      tableName: "media"
    })
  } catch (error) {
    console.error("Error debugging media schema:", error)
    return NextResponse.json(
      { error: `Failed to debug schema: ${error instanceof Error ? error.message : String(error)}` },
      { status: 500 }
    )
  }
}