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

    // Try to select from the table
    const { error } = await supabase.from(tableName).select("count").limit(1)

    // If error code is 42P01, table doesn't exist
    if (error && error.code === "42P01") {
      return NextResponse.json({ exists: false })
    }

    return NextResponse.json({ exists: true })
  } catch (error: any) {
    console.error("Error checking if table exists:", error)
    return NextResponse.json({ error: error.message, exists: false }, { status: 500 })
  }
}
