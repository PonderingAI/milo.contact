import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const tableName = searchParams.get("table")

  if (!tableName) {
    return NextResponse.json({ error: "Table name is required" }, { status: 400 })
  }

  try {
    const supabaseUrl = process.env.SUPABASE_URL
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json(
        { error: "Supabase credentials are not configured", code: "MISSING_CREDENTIALS" },
        { status: 500 },
      )
    }

    const supabase = createClient(supabaseUrl, supabaseKey)

    // Check if the table exists with a timeout
    const checkPromise = supabase
      .from("information_schema.tables")
      .select("table_name")
      .eq("table_schema", "public")
      .eq("table_name", tableName)
      .single()

    // Create a timeout promise
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => {
        reject(new Error("Database query timed out after 5 seconds"))
      }, 5000)
    })

    // Race the query against the timeout
    const { data, error } = (await Promise.race([
      checkPromise,
      timeoutPromise.then(() => {
        throw new Error("Query timed out")
      }),
    ])) as any

    if (error) {
      console.error("Error checking table:", error)
      return NextResponse.json(
        {
          error: "Failed to check table",
          details: error.message,
          code: error.code || "DB_ERROR",
          hint: "This may be due to insufficient permissions or a database connection issue.",
        },
        { status: 500 },
      )
    }

    return NextResponse.json({ exists: !!data })
  } catch (error: any) {
    console.error("Unexpected error checking table:", error)
    return NextResponse.json(
      {
        error: "Failed to check table",
        details: error.message || String(error),
        code: "UNEXPECTED_ERROR",
        stack: process.env.NODE_ENV === "development" ? error.stack : undefined,
      },
      { status: 500 },
    )
  }
}
