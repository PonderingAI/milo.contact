-- Fix Projects Table RLS Policies for Clerk-Only System
-- This migration ensures that authenticated users can write to the projects table
-- since admin permissions are now handled entirely at the application layer via Clerk metadata.

-- =============================================
-- Fix projects table policies
-- =============================================

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
-- Admin permission checks are handled in the application layer
DROP POLICY IF EXISTS authenticated_insert_projects ON projects;
CREATE POLICY "authenticated_insert_projects"
ON projects
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Allow authenticated users to update projects
-- Admin permission checks are handled in the application layer
DROP POLICY IF EXISTS authenticated_update_projects ON projects;
CREATE POLICY "authenticated_update_projects"
ON projects
FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

-- Allow authenticated users to delete projects
-- Admin permission checks are handled in the application layer
DROP POLICY IF EXISTS authenticated_delete_projects ON projects;
CREATE POLICY "authenticated_delete_projects"
ON projects
FOR DELETE
TO authenticated
USING (true);

-- =============================================
-- Fix other tables that might have similar issues
-- =============================================

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