import { NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase-server"

export async function GET() {
  try {
    const supabase = createAdminClient()

    // Create the tag_order table if it doesn't exist
    const { error: createError } = await supabase.rpc("exec_sql", {
      sql_query: `
        CREATE TABLE IF NOT EXISTS tag_order (
          id SERIAL PRIMARY KEY,
          tag_type TEXT NOT NULL,
          tag_name TEXT NOT NULL,
          display_order INTEGER NOT NULL,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          UNIQUE(tag_type, tag_name)
        );
        
        -- Enable RLS
        ALTER TABLE tag_order ENABLE ROW LEVEL SECURITY;
        
        -- Create policies
        DO $$
        BEGIN
          IF NOT EXISTS (
            SELECT 1 FROM pg_policies WHERE tablename = 'tag_order' AND policyname = 'Allow public read access'
          ) THEN
            CREATE POLICY "Allow public read access" 
              ON tag_order 
              FOR SELECT 
              TO public 
              USING (true);
          END IF;
          
          IF NOT EXISTS (
            SELECT 1 FROM pg_policies WHERE tablename = 'tag_order' AND policyname = 'Allow admin full access'
          ) THEN
            CREATE POLICY "Allow admin full access" 
              ON tag_order 
              FOR ALL 
              TO authenticated 
              USING (true); -- Admin permission checking now handled at API level (Clerk-only)
          END IF;
        END
        $$;
      `,
    })

    if (createError) {
      console.error("Error creating tag_order table:", createError)
      return NextResponse.json({ error: createError.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, message: "Tag order table created successfully" })
  } catch (error: any) {
    console.error("Error in setup-tag-order-table:", error)
    return NextResponse.json({ error: error.message || "An unknown error occurred" }, { status: 500 })
  }
}
