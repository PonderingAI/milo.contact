-- Migration: Fix RLS Policies for All Tables
-- This script fixes Row Level Security policies to use authenticated user access
-- Run this in your Supabase SQL Editor

-- Fix projects table policies
DROP POLICY IF EXISTS "public_read_projects" ON projects;
DROP POLICY IF EXISTS "admins_manage_projects" ON projects;
DROP POLICY IF EXISTS "authenticated_read_projects" ON projects;
DROP POLICY IF EXISTS "authenticated_insert_projects" ON projects;
DROP POLICY IF EXISTS "authenticated_update_projects" ON projects;
DROP POLICY IF EXISTS "authenticated_delete_projects" ON projects;

CREATE POLICY "public_read_projects"
ON projects FOR SELECT TO public USING (true);

CREATE POLICY "authenticated_read_projects"
ON projects FOR SELECT TO authenticated USING (true);

CREATE POLICY "authenticated_insert_projects"
ON projects FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "authenticated_update_projects"
ON projects FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "authenticated_delete_projects"
ON projects FOR DELETE TO authenticated USING (true);

-- Fix bts_images table policies
DROP POLICY IF EXISTS "public_read_bts_images" ON bts_images;
DROP POLICY IF EXISTS "admins_manage_bts_images" ON bts_images;
DROP POLICY IF EXISTS "authenticated_read_bts_images" ON bts_images;
DROP POLICY IF EXISTS "authenticated_insert_bts_images" ON bts_images;
DROP POLICY IF EXISTS "authenticated_update_bts_images" ON bts_images;
DROP POLICY IF EXISTS "authenticated_delete_bts_images" ON bts_images;

CREATE POLICY "public_read_bts_images"
ON bts_images FOR SELECT TO public USING (true);

CREATE POLICY "authenticated_read_bts_images"
ON bts_images FOR SELECT TO authenticated USING (true);

CREATE POLICY "authenticated_insert_bts_images"
ON bts_images FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "authenticated_update_bts_images"
ON bts_images FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "authenticated_delete_bts_images"
ON bts_images FOR DELETE TO authenticated USING (true);

-- Fix media table policies
DROP POLICY IF EXISTS "public_read_media" ON media;
DROP POLICY IF EXISTS "admins_manage_media" ON media;
DROP POLICY IF EXISTS "authenticated_read_media" ON media;
DROP POLICY IF EXISTS "authenticated_insert_media" ON media;
DROP POLICY IF EXISTS "authenticated_update_media" ON media;
DROP POLICY IF EXISTS "authenticated_delete_media" ON media;

CREATE POLICY "public_read_media"
ON media FOR SELECT TO public USING (true);

CREATE POLICY "authenticated_read_media"
ON media FOR SELECT TO authenticated USING (true);

CREATE POLICY "authenticated_insert_media"
ON media FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "authenticated_update_media"
ON media FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "authenticated_delete_media"
ON media FOR DELETE TO authenticated USING (true);

-- Fix site_settings table policies
DROP POLICY IF EXISTS "public_read_site_settings" ON site_settings;
DROP POLICY IF EXISTS "admins_manage_settings" ON site_settings;
DROP POLICY IF EXISTS "authenticated_read_settings" ON site_settings;
DROP POLICY IF EXISTS "authenticated_insert_settings" ON site_settings;
DROP POLICY IF EXISTS "authenticated_update_settings" ON site_settings;
DROP POLICY IF EXISTS "authenticated_delete_settings" ON site_settings;

CREATE POLICY "public_read_site_settings"
ON site_settings FOR SELECT TO public USING (true);

CREATE POLICY "authenticated_read_settings"
ON site_settings FOR SELECT TO authenticated USING (true);

CREATE POLICY "authenticated_insert_settings"
ON site_settings FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "authenticated_update_settings"
ON site_settings FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "authenticated_delete_settings"
ON site_settings FOR DELETE TO authenticated USING (true);

-- Fix main_media table policies (if table exists)
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'main_media') THEN
        DROP POLICY IF EXISTS "public_read_main_media" ON main_media;
        DROP POLICY IF EXISTS "admins_manage_main_media" ON main_media;
        DROP POLICY IF EXISTS "authenticated_read_main_media" ON main_media;
        DROP POLICY IF EXISTS "authenticated_insert_main_media" ON main_media;
        DROP POLICY IF EXISTS "authenticated_update_main_media" ON main_media;
        DROP POLICY IF EXISTS "authenticated_delete_main_media" ON main_media;

        CREATE POLICY "public_read_main_media"
        ON main_media FOR SELECT TO public USING (true);

        CREATE POLICY "authenticated_read_main_media"
        ON main_media FOR SELECT TO authenticated USING (true);

        CREATE POLICY "authenticated_insert_main_media"
        ON main_media FOR INSERT TO authenticated WITH CHECK (true);

        CREATE POLICY "authenticated_update_main_media"
        ON main_media FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

        CREATE POLICY "authenticated_delete_main_media"
        ON main_media FOR DELETE TO authenticated USING (true);
    END IF;
END $$;

-- Add comment to track this migration
COMMENT ON SCHEMA public IS 'RLS policies updated to use authenticated user access - migration completed';
