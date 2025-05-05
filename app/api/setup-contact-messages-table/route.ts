import { createAdminClient } from "@/lib/supabase-server"
import { NextResponse } from "next/server"
import fs from "fs"
import path from "path"

export async function GET() {
  try {
    const supabase = createAdminClient()

    // Read the SQL file for creating the contact_messages table
    const sqlFilePath = path.join(process.cwd(), "setup", "create-contact-messages-table.sql")
    let sql = ""

    try {
      sql = fs.readFileSync(sqlFilePath, "utf8")
    } catch (readError) {
      console.error("Error reading SQL file:", readError)
      // Use hardcoded SQL if file read fails
      sql = `
        -- Create contact_messages table
        CREATE TABLE IF NOT EXISTS contact_messages (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          name TEXT NOT NULL,
          email TEXT NOT NULL,
          message TEXT NOT NULL,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          read BOOLEAN DEFAULT FALSE
        );

        -- Add RLS policies
        ALTER TABLE contact_messages ENABLE ROW LEVEL SECURITY;

        -- Allow anyone to insert messages
        CREATE POLICY "Allow anyone to insert messages"
        ON contact_messages
        FOR INSERT
        TO public
        WITH CHECK (true);

        -- Allow authenticated users with admin role to read all messages
        CREATE POLICY "Allow admins to read messages"
        ON contact_messages
        FOR SELECT
        USING (
          EXISTS (
            SELECT 1 FROM user_roles
            WHERE user_id = auth.uid() 
            AND role = 'admin'
          )
        );
      `
    }

    // Try to execute the SQL using the exec_sql RPC function
    const { error: rpcError } = await supabase.rpc("exec_sql", { sql })

    if (rpcError) {
      console.error("RPC Error setting up contact_messages table:", rpcError)

      // Fall back to direct SQL execution if RPC fails
      try {
        const { error: directError } = await supabase.sql(sql)

        if (directError) {
          console.error("Direct SQL error setting up contact_messages table:", directError)
          return NextResponse.json(
            {
              success: false,
              error: "Failed to set up contact_messages table",
              details: directError.message,
            },
            { status: 500 },
          )
        }
      } catch (sqlError: any) {
        console.error("Error executing SQL directly:", sqlError)
        return NextResponse.json(
          {
            success: false,
            error: "Failed to set up contact_messages table",
            details: sqlError.message,
          },
          { status: 500 },
        )
      }
    }

    return NextResponse.json({
      success: true,
      message: "Contact messages table set up successfully",
    })
  } catch (error: any) {
    console.error("Error in setup-contact-messages-table:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Failed to set up contact_messages table",
        details: error.message,
      },
      { status: 500 },
    )
  }
}
