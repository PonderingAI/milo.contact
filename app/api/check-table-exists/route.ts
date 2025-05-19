import { type NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase-server"

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const tableName = searchParams.get("table")

    if (!tableName) {
      return NextResponse.json({ error: "Table name is required" }, { status: 400 })
    }

    const supabase = createAdminClient()

    // Query to check if the table exists
    const { data, error } = await supabase.rpc("check_table_exists", { table_name: tableName })

    if (error) {
      // If the RPC function doesn't exist, fall back to a direct query
      console.log("RPC check_table_exists failed, falling back to direct query:", error)

      // Query information_schema to check if the table exists
      const { data: tableData, error: tableError } = await supabase
        .from("information_schema.tables")
        .select("table_name")
        .eq("table_schema", "public")
        .eq("table_name", tableName)
        .single()

      if (tableError && tableError.code !== "PGRST116") {
        // PGRST116 is "Results contain 0 rows"
        console.error("Error checking table existence:", tableError)
        return NextResponse.json({ error: tableError.message }, { status: 500 })
      }

      return NextResponse.json({ exists: !!tableData })
    }

    return NextResponse.json({ exists: !!data })
  } catch (error: any) {
    console.error("Error in check-table-exists:", error)
    return NextResponse.json({ error: error.message || "An unknown error occurred" }, { status: 500 })
  }
}
