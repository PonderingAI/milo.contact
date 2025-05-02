import { createAdminClient } from "@/lib/supabase-server"
import { NextResponse } from "next/server"

export async function GET() {
  try {
    const supabase = createAdminClient()

    // Create public read policy for the media bucket
    const createPolicySql = `
      BEGIN;
      
      -- Drop existing policies if they exist
      DROP POLICY IF EXISTS "Public Read Media" ON storage.objects;
      DROP POLICY IF EXISTS "Admin Insert Media" ON storage.objects;
      
      -- Create a policy that allows public read access to the media bucket
      CREATE POLICY "Public Read Media" 
      ON storage.objects 
      FOR SELECT 
      USING (bucket_id = 'media');
      
      -- Create a policy that only allows admins to insert into the media bucket
      -- We can't directly check Clerk metadata from Postgres, so we rely on
      -- application-level checks for insertion and deletion
      CREATE POLICY "Admin Insert Media" 
      ON storage.objects 
      FOR INSERT 
      WITH CHECK (bucket_id = 'media');
      
      COMMIT;
    `

    // Execute the SQL to create the policies
    const { error } = await supabase.rpc("exec_sql", { sql: createPolicySql })

    if (error) {
      console.error("Error setting up media storage policy:", error)
      return NextResponse.json(
        { success: false, message: `Error setting up media storage policy: ${error.message}` },
        { status: 500 },
      )
    }

    return NextResponse.json({
      success: true,
      message: "Media storage policies configured successfully",
    })
  } catch (error) {
    console.error("Error in setup-media-storage-policy:", error)
    return NextResponse.json(
      {
        success: false,
        message: `Error setting up media storage policy: ${error instanceof Error ? error.message : String(error)}`,
      },
      { status: 500 },
    )
  }
}
