import { createServerClient } from "@/lib/supabase-server"
import { NextResponse } from "next/server"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const table = searchParams.get("table")

    if (!table) {
      return NextResponse.json({ error: "Table name is required" }, { status: 400 })
    }

    const supabase = createServerClient()

    // Query to check if the table exists
    const { data, error } = await supabase.rpc("check_table_exists", { table_name: table })

    if (error) {
      // If the RPC function doesn't exist, try a different approach
      try {
        // Try to select from the table - if it doesn't exist, it will throw an error
        await supabase.from(table).select("*").limit(1)
        return NextResponse.json({ exists: true })
      } catch (err) {
        console.error("Error checking table existence:", err)
        return NextResponse.json({ exists: false })
      }
    }

    return NextResponse.json({ exists: data })
  } catch (error) {
    console.error("Error in check-table-exists route:", error)
    return NextResponse.json({ error: "Failed to check if table exists" }, { status: 500 })
  }
}
