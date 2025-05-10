import { createAdminClient } from "@/lib/supabase-server"
import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const tableName = searchParams.get("table")

    if (!tableName) {
      return NextResponse.json({ error: "Missing table parameter" }, { status: 400 })
    }

    const supabase = createAdminClient()

    // Check if the table exists in the information schema
    const { data, error } = await supabase
      .from("information_schema.tables")
      .select("table_name")
      .eq("table_schema", "public")
      .eq("table_name", tableName)
      .single()

    if (error && error.code !== "PGRST116") {
      console.error("Error checking if table exists:", error)
      return NextResponse.json({ error: error.message, exists: false }, { status: 500 })
    }

    return NextResponse.json({ exists: !!data })
  } catch (error: any) {
    console.error("Error checking if table exists:", error)
    return NextResponse.json({ error: error.message, exists: false }, { status: 500 })
  }
}
