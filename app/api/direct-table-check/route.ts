import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase-server"

export async function POST(request: Request) {
  try {
    const supabase = createClient()
    const { tableName } = await request.json()

    if (!tableName) {
      return NextResponse.json({ error: "Table name is required" }, { status: 400 })
    }

    // Check if the table exists
    const { data, error } = await supabase.from(tableName).select("*").limit(1).maybeSingle()

    if (error && error.code !== "PGRST116") {
      // PGRST116 means no rows found, which is fine for our check
      console.error(`Error checking table ${tableName}:`, error)
      return NextResponse.json({ exists: false, error: error.message }, { status: 200 })
    }

    return NextResponse.json({ exists: true }, { status: 200 })
  } catch (error) {
    console.error("Error in direct-table-check:", error)
    return NextResponse.json({ error: "Failed to check table" }, { status: 500 })
  }
}
