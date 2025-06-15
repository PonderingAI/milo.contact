import { NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase-server"
import { requireAdmin } from "@/lib/auth-server"
import { auth } from "@clerk/nextjs/server"

export async function POST(request: Request) {
  console.log("=== APPLY RLS FIX API CALLED ===")
  
  try {
    // Check if user is authenticated and has admin role
    const { userId } = auth()
    console.log("Auth userId:", userId)
    
    if (!userId) {
      console.log("No userId - returning 401")
      return NextResponse.json({ 
        error: "Unauthorized", 
        debug_userIdFromAuth: null 
      }, { status: 401 })
    }
    
    // Use requireAdmin to check permissions
    const adminError = await requireAdmin(request)
    if (adminError) {
      return adminError
    }

    // Use admin client to apply RLS policy changes
    const supabase = createAdminClient()

    console.log("Applying RLS policy fixes...")

    // Apply the SQL migration
    const migrationSql = `
-- Fix Projects Table RLS Policies for Clerk-Only System

-- Drop any existing admin-only policies that reference user_roles
DROP POLICY IF EXISTS admins_manage_projects ON projects;

-- Allow authenticated users to read projects
DROP POLICY IF EXISTS authenticated_read_projects ON projects;
CREATE POLICY "authenticated_read_projects"
ON projects
FOR SELECT
TO authenticated
USING (true);

-- Allow authenticated users to insert projects
DROP POLICY IF EXISTS authenticated_insert_projects ON projects;
CREATE POLICY "authenticated_insert_projects"
ON projects
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Allow authenticated users to update projects
DROP POLICY IF EXISTS authenticated_update_projects ON projects;
CREATE POLICY "authenticated_update_projects"
ON projects
FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

-- Allow authenticated users to delete projects
DROP POLICY IF EXISTS authenticated_delete_projects ON projects;
CREATE POLICY "authenticated_delete_projects"
ON projects
FOR DELETE
TO authenticated
USING (true);

-- Fix bts_images table policies
DROP POLICY IF EXISTS admins_manage_bts_images ON bts_images;
DROP POLICY IF EXISTS authenticated_read_bts_images ON bts_images;
DROP POLICY IF EXISTS authenticated_insert_bts_images ON bts_images;
DROP POLICY IF EXISTS authenticated_update_bts_images ON bts_images;
DROP POLICY IF EXISTS authenticated_delete_bts_images ON bts_images;

CREATE POLICY "authenticated_read_bts_images"
ON bts_images FOR SELECT TO authenticated USING (true);

CREATE POLICY "authenticated_insert_bts_images"
ON bts_images FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "authenticated_update_bts_images"
ON bts_images FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "authenticated_delete_bts_images"
ON bts_images FOR DELETE TO authenticated USING (true);

-- Fix media table policies  
DROP POLICY IF EXISTS admins_manage_media ON media;
DROP POLICY IF EXISTS authenticated_read_media ON media;
DROP POLICY IF EXISTS authenticated_insert_media ON media;
DROP POLICY IF EXISTS authenticated_update_media ON media;
DROP POLICY IF EXISTS authenticated_delete_media ON media;

CREATE POLICY "authenticated_read_media"
ON media FOR SELECT TO authenticated USING (true);

CREATE POLICY "authenticated_insert_media"
ON media FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "authenticated_update_media"
ON media FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "authenticated_delete_media"
ON media FOR DELETE TO authenticated USING (true);

-- Fix site_settings table policies
DROP POLICY IF EXISTS admins_manage_settings ON site_settings;
DROP POLICY IF EXISTS authenticated_read_settings ON site_settings;
DROP POLICY IF EXISTS authenticated_insert_settings ON site_settings;
DROP POLICY IF EXISTS authenticated_update_settings ON site_settings;
DROP POLICY IF EXISTS authenticated_delete_settings ON site_settings;

CREATE POLICY "authenticated_read_settings"
ON site_settings FOR SELECT TO authenticated USING (true);

CREATE POLICY "authenticated_insert_settings"
ON site_settings FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "authenticated_update_settings"
ON site_settings FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "authenticated_delete_settings"
ON site_settings FOR DELETE TO authenticated USING (true);
    `.trim()

    console.log("Executing SQL migration...")
    const { data, error } = await supabase.rpc('exec_sql', { sql_query: migrationSql })

    if (error) {
      console.error("Error applying RLS fixes:", error)
      return NextResponse.json({
        success: false,
        error: "Failed to apply RLS policy fixes",
        details: error.message,
        code: error.code,
        debug_userIdFromAuth: userId,
      }, { status: 500 })
    }

    console.log("RLS policy fixes applied successfully")
    
    return NextResponse.json({
      success: true,
      message: "RLS policy fixes applied successfully",
      details: "All tables now use authenticated user policies instead of user_roles table checks",
      applied_fixes: [
        "projects table - all CRUD operations for authenticated users",
        "bts_images table - all CRUD operations for authenticated users", 
        "media table - all CRUD operations for authenticated users",
        "site_settings table - all CRUD operations for authenticated users"
      ]
    })

  } catch (error) {
    console.error("=== APPLY RLS FIX ERROR ===", error)
    
    let userId = null
    try {
      const authResult = auth()
      userId = authResult.userId
    } catch (authError) {
      console.error("Error getting userId in catch block:", authError)
    }
    
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error occurred",
        details: "There was an unexpected error applying RLS fixes.",
        debug_userIdFromAuth: userId,
        errorMessage: error instanceof Error ? error.message : "Unknown error",
        stack: process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.stack : undefined) : undefined
      },
      { status: 500 },
    )
  }
}