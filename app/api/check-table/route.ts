import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { NextResponse } from "next/server"

export const dynamic = "force-dynamic"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const table = searchParams.get("table") || "projects"

    const supabase = createRouteHandlerClient({ cookies })

    // Try a simple query to check if the table exists
    const { error } = await supabase.from(table).select("*").limit(1)

    // If there's an error about the relation not existing, the table doesn't exist
    if (error && (error.code === "PGRST116" || error.message?.includes("does not exist"))) {
      return NextResponse.json({ exists: false, message: "Table does not exist" })
    }

    // If there's some other error, log it but don't fail the check
    if (error) {
      console.warn(`Warning checking table ${table}:`, error)
      // We'll assume the table exists but there was an error querying it
      return NextResponse.json({ exists: true, warning: "Error querying table", details: error.message })
    }

    return NextResponse.json({ exists: true, message: "Table exists" })
  } catch (error) {
    console.error("Error in check-table:", error)
    return NextResponse.json({ error: "Failed to check table" }, { status: 500 })
  }
}
