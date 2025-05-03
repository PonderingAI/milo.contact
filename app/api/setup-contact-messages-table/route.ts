import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import fs from "fs"
import path from "path"

export async function GET() {
  try {
    // Initialize Supabase client with service role key to bypass RLS
    const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

    // Read the SQL file
    const sqlFilePath = path.join(process.cwd(), "setup", "create-contact-messages-table.sql")
    const sql = fs.readFileSync(sqlFilePath, "utf8")

    // Execute the SQL
    const { error } = await supabase.rpc("exec_sql", { sql })

    if (error) {
      console.error("Error setting up contact_messages table:", error)

      // Try direct SQL execution if RPC fails
      const { error: directError } = await supabase.sql(sql)

      if (directError) {
        console.error("Error with direct SQL execution:", directError)
        return NextResponse.json(
          {
            success: false,
            error: "Failed to set up contact_messages table",
          },
          { status: 500 },
        )
      }
    }

    return NextResponse.json({
      success: true,
      message: "Contact messages table set up successfully",
    })
  } catch (error) {
    console.error("Error in setup-contact-messages-table:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Failed to set up contact_messages table",
      },
      { status: 500 },
    )
  }
}
