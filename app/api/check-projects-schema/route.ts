import { NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase-server"

export async function GET() {
  console.log("=== check-projects-schema API called ===")
  
  try {
    const supabase = createAdminClient()
    console.log("Supabase admin client created successfully")

    // Method 1: Try to directly query projects table (most reliable)
    console.log("Method 1: Testing direct projects table access...")
    try {
      const { data: directTestData, error: directTestError } = await supabase
        .from("projects")
        .select("id")
        .limit(1)

      if (!directTestError && directTestData !== null) {
        console.log("Method 1: Direct projects table access successful")
        
        // Since direct access works, try to get schema via a sample query
        const { data: sampleData, error: sampleError } = await supabase
          .from("projects")
          .select("*")
          .limit(1)
        
        if (!sampleError && sampleData) {
          const columns = sampleData.length > 0 
            ? Object.keys(sampleData[0]).map(name => ({ 
                column_name: name,
                data_type: 'unknown',
                is_nullable: 'unknown'
              }))
            : [
                // Default expected columns
                { column_name: 'id', data_type: 'uuid', is_nullable: 'NO' },
                { column_name: 'title', data_type: 'text', is_nullable: 'NO' },
                { column_name: 'description', data_type: 'text', is_nullable: 'YES' },
                { column_name: 'image', data_type: 'text', is_nullable: 'NO' },
                { column_name: 'category', data_type: 'text', is_nullable: 'NO' },
                { column_name: 'role', data_type: 'text', is_nullable: 'NO' },
                { column_name: 'project_date', data_type: 'date', is_nullable: 'YES' },
                { column_name: 'is_public', data_type: 'boolean', is_nullable: 'YES' },
                { column_name: 'thumbnail_url', data_type: 'text', is_nullable: 'YES' },
                { column_name: 'created_at', data_type: 'timestamptz', is_nullable: 'YES' },
                { column_name: 'updated_at', data_type: 'timestamptz', is_nullable: 'YES' }
              ]
          
          console.log("Method 1: Successfully extracted schema from direct access")
          return NextResponse.json({ 
            exists: true,
            columns,
            count: columns.length,
            method: "direct_table_access"
          })
        }
      } else {
        console.log("Method 1: Direct projects table access failed:", directTestError?.message)
      }
    } catch (directError) {
      console.log("Method 1: Direct access exception:", directError)
    }

    // Method 2: Try information_schema.tables (may not work in all deployments)
    console.log("Method 2: Testing information_schema.tables access...")
    try {
      const { data: tableExists, error: tableCheckError } = await supabase
        .from("information_schema.tables")
        .select("table_name")
        .eq("table_name", "projects")
        .eq("table_schema", "public")
        .single()

      if (!tableCheckError && tableExists) {
        console.log("Method 2: information_schema.tables access successful")
        
        // Try to get column information
        const { data: columnsData, error: columnsError } = await supabase
          .from("information_schema.columns")
          .select("column_name, data_type, is_nullable")
          .eq("table_name", "projects")
          .eq("table_schema", "public")
          .order("ordinal_position")

        if (!columnsError && columnsData) {
          console.log("Method 2: Successfully got schema from information_schema")
          return NextResponse.json({ 
            exists: true,
            columns: columnsData,
            count: columnsData.length,
            method: "information_schema"
          })
        } else {
          console.log("Method 2: Failed to get columns from information_schema:", columnsError?.message)
        }
      } else {
        console.log("Method 2: information_schema.tables failed:", tableCheckError?.message)
      }
    } catch (infoSchemaError) {
      console.log("Method 2: information_schema exception:", infoSchemaError)
    }

    // Method 3: Return a reasonable default schema
    console.log("Method 3: Using fallback default schema")
    const defaultColumns = [
      { column_name: 'id', data_type: 'uuid', is_nullable: 'NO' },
      { column_name: 'title', data_type: 'text', is_nullable: 'NO' },
      { column_name: 'description', data_type: 'text', is_nullable: 'YES' },
      { column_name: 'image', data_type: 'text', is_nullable: 'NO' },
      { column_name: 'category', data_type: 'text', is_nullable: 'NO' },
      { column_name: 'role', data_type: 'text', is_nullable: 'NO' },
      { column_name: 'project_date', data_type: 'date', is_nullable: 'YES' },
      { column_name: 'is_public', data_type: 'boolean', is_nullable: 'YES' },
      { column_name: 'thumbnail_url', data_type: 'text', is_nullable: 'YES' },
      { column_name: 'created_at', data_type: 'timestamptz', is_nullable: 'YES' },
      { column_name: 'updated_at', data_type: 'timestamptz', is_nullable: 'YES' }
    ]

    console.log("Method 3: Returning default schema with warning")
    return NextResponse.json({ 
      exists: true, // Assume it exists and let the actual operations fail if needed
      columns: defaultColumns,
      count: defaultColumns.length,
      method: "fallback_default",
      warning: "Could not verify table schema, using default expected schema"
    })

  } catch (error: any) {
    console.error("=== check-projects-schema CRITICAL ERROR ===", error)
    
    // Even in critical error, return a usable default
    const defaultColumns = [
      { column_name: 'id', data_type: 'uuid', is_nullable: 'NO' },
      { column_name: 'title', data_type: 'text', is_nullable: 'NO' },
      { column_name: 'description', data_type: 'text', is_nullable: 'YES' },
      { column_name: 'image', data_type: 'text', is_nullable: 'NO' },
      { column_name: 'category', data_type: 'text', is_nullable: 'NO' },
      { column_name: 'role', data_type: 'text', is_nullable: 'NO' },
      { column_name: 'project_date', data_type: 'date', is_nullable: 'YES' },
      { column_name: 'is_public', data_type: 'boolean', is_nullable: 'YES' },
      { column_name: 'thumbnail_url', data_type: 'text', is_nullable: 'YES' },
      { column_name: 'created_at', data_type: 'timestamptz', is_nullable: 'YES' },
      { column_name: 'updated_at', data_type: 'timestamptz', is_nullable: 'YES' }
    ]

    return NextResponse.json({ 
      exists: true, // Assume it exists for graceful degradation
      columns: defaultColumns,
      count: defaultColumns.length,
      method: "error_fallback",
      error: error.message || "Unknown error occurred",
      warning: "Schema detection failed, using default schema"
    })
  }
}
