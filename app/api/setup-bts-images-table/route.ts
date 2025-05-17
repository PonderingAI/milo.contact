import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { isAdmin } from "@/lib/auth-utils"
import fs from "fs"
import path from "path"

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL || ""
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ""
const supabase = createClient(supabaseUrl, supabaseServiceKey)

export async function GET(request: NextRequest) {
  try {
    // Check if user is admin
    const adminCheck = await isAdmin()
    if (!adminCheck.isAdmin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Read the SQL file
    const sqlFilePath = path.join(process.cwd(), "docs", "setup", "bts_images_table.sql")
    let sql

    try {
      sql = fs.readFileSync(sqlFilePath, "utf8")
    } catch (error) {
      console.error("Error reading SQL file:", error)
      return NextResponse.json({ error: "Failed to read SQL file" }, { status: 500 })
    }

    // Execute the SQL
    const { error } = await supabase.rpc("exec_sql", { sql_query: sql })

    if (error) {
      console.error("Error setting up BTS images table:", error)
      return NextResponse.json({ error: "Failed to set up BTS images table" }, { status: 500 })
    }

    return NextResponse.json({ success: true, message: "BTS images table set up successfully" })
  } catch (error) {
    console.error("Error in setup BTS images table API:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
