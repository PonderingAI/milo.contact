import { NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase-server"
import fs from "fs"
import path from "path"

export async function GET() {
  try {
    const supabase = createAdminClient()

    // Read the SQL file
    const sqlFilePath = path.join(process.cwd(), "setup", "create-dependency-settings-table.sql")
    let sql

    try {
      sql = fs.readFileSync(sqlFilePath, "utf8")
    } catch (err) {
      console.error("Error reading SQL file:", err)
      return NextResponse.json({ error: "Failed to read SQL file" }, { status: 500 })
    }

    // Execute the SQL
    const { error } = await supabase.rpc("run_sql", { sql })

    if (error) {
      console.error("Error setting up dependency settings table:", error)
      return NextResponse.json({ error: "Failed to set up dependency settings table" }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error in setup dependency settings table API:", error)
    return NextResponse.json({ error: "Failed to set up dependency settings table" }, { status: 500 })
  }
}
