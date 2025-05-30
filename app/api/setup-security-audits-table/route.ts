import { NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase-server"
import fs from "fs"
import path from "path"

export async function POST() {
  try {
    const supabase = createAdminClient()

    // Read the SQL file
    const sqlFilePath = path.join(process.cwd(), "setup", "create-security-audits-table.sql")
    const sqlQuery = await fs.promises.readFile(sqlFilePath, "utf8")

    // Execute the SQL query
    const { error } = await supabase.rpc("exec_sql", { sql_query: sqlQuery })

    if (error) {
      console.error("Error creating security audits table:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, message: "Security audits table created successfully" })
  } catch (error) {
    console.error("Error setting up security audits table:", error)
    return NextResponse.json({ error: error instanceof Error ? error.message : String(error) }, { status: 500 })
  }
}
