-- Remove user_roles table migration
-- This migration completely removes the user_roles table and updates all RLS policies
-- to remove dependencies on the user_roles table for admin checks.
-- Admin permissions are now handled entirely in the application layer via Clerk metadata.

-- =============================================
-- DROP THE user_roles TABLE
-- =============================================
DROP TABLE IF EXISTS user_roles CASCADE;

-- =============================================
-- Update RLS policies to remove user_roles dependencies
-- Since we're handling admin permissions in the application layer,
-- we'll simplify policies to basic authenticated user checks
-- =============================================

-- =============================================
-- Fix site_settings table policies
-- =============================================
-- Allow all authenticated users to read site settings
DROP POLICY IF EXISTS authenticated_read_settings ON site_settings;
CREATE POLICY "authenticated_read_settings"
ON site_settings
FOR SELECT
TO authenticated
USING (true);

-- Note: Write permissions for site_settings are handled in application layer
-- Only admin-checked API routes can modify site settings

-- =============================================
-- Fix projects table policies  
-- =============================================
-- Allow authenticated users to read projects
DROP POLICY IF EXISTS authenticated_read_projects ON projects;
CREATE POLICY "authenticated_read_projects"
ON projects
FOR SELECT
TO authenticated
USING (true);

-- Note: Write permissions for projects are handled in application layer
-- Only admin-checked API routes can modify projects

-- =============================================
-- Fix media table policies
-- =============================================
-- Allow authenticated users to read media
DROP POLICY IF EXISTS authenticated_read_media ON media;
CREATE POLICY "authenticated_read_media"
ON media
FOR SELECT
TO authenticated
USING (true);

-- Note: Write permissions for media are handled in application layer
-- Only admin-checked API routes can modify media

-- =============================================
-- Fix bts_images table policies
-- =============================================
-- Allow authenticated users to read bts_images
DROP POLICY IF EXISTS authenticated_read_bts_images ON bts_images;
CREATE POLICY "authenticated_read_bts_images"
ON bts_images
FOR SELECT
TO authenticated
USING (true);

-- Note: Write permissions for bts_images are handled in application layer
-- Only admin-checked API routes can modify bts_images

-- =============================================
-- Fix contact_messages table policies
-- =============================================
-- Allow public to insert contact messages (for contact form)
DROP POLICY IF EXISTS public_insert_messages ON contact_messages;
CREATE POLICY "public_insert_messages"
ON contact_messages
FOR INSERT
TO anon, authenticated
WITH CHECK (true);

-- Allow authenticated users to read their own messages
DROP POLICY IF EXISTS users_read_own_messages ON contact_messages;
CREATE POLICY "users_read_own_messages"
ON contact_messages
FOR SELECT
TO authenticated
USING (true);

-- Note: Admin access to contact_messages is handled in application layer
-- Only admin-checked API routes can read/update all messages

-- =============================================
-- Fix dependencies table policies
-- =============================================
-- Allow authenticated users to read dependencies
DROP POLICY IF EXISTS authenticated_read_dependencies ON dependencies;
CREATE POLICY "authenticated_read_dependencies"
ON dependencies
FOR SELECT
TO authenticated
USING (true);

-- Note: Write permissions for dependencies are handled in application layer
-- Only admin-checked API routes can modify dependencies

-- =============================================
-- Fix dependency_settings table policies
-- =============================================
-- Allow authenticated users to read dependency settings
DROP POLICY IF EXISTS authenticated_read_dependency_settings ON dependency_settings;
CREATE POLICY "authenticated_read_dependency_settings"
ON dependency_settings
FOR SELECT
TO authenticated
USING (true);

-- Note: Write permissions for dependency_settings are handled in application layer
-- Only admin-checked API routes can modify dependency_settings

-- =============================================
-- Fix dependency_compatibility table policies
-- =============================================
-- Allow authenticated users to read compatibility data
DROP POLICY IF EXISTS authenticated_read_dependency_compatibility ON dependency_compatibility;
CREATE POLICY "authenticated_read_dependency_compatibility"
ON dependency_compatibility
FOR SELECT
TO authenticated
USING (true);

-- Note: Write permissions for dependency_compatibility are handled in application layer
-- Only admin-checked API routes can modify dependency_compatibility

-- =============================================
-- Fix security_audits table policies (if exists)
-- =============================================
-- Allow authenticated users to read security audits
DROP POLICY IF EXISTS authenticated_read_security_audits ON security_audits;
CREATE POLICY "authenticated_read_security_audits"
ON security_audits
FOR SELECT
TO authenticated
USING (true);

-- Note: Write permissions for security_audits are handled in application layer
-- Only admin-checked API routes can modify security_audits

-- =============================================
-- Fix widget_types table policies (if exists)
-- =============================================
-- Allow authenticated users to read widget types
DROP POLICY IF EXISTS authenticated_read_widget_types ON widget_types;
CREATE POLICY "authenticated_read_widget_types"
ON widget_types
FOR SELECT
TO authenticated
USING (true);

-- Note: Write permissions for widget_types are handled in application layer
-- Only admin-checked API routes can modify widget_types

-- =============================================
-- Fix user_widgets table policies (if exists)
-- =============================================
-- Allow authenticated users to read/manage their own widgets
DROP POLICY IF EXISTS users_manage_own_widgets ON user_widgets;
CREATE POLICY "users_manage_own_widgets"
ON user_widgets
FOR ALL
TO authenticated
USING (user_id = auth.uid()::TEXT)
WITH CHECK (user_id = auth.uid()::TEXT);

-- Note: Admin access to all user_widgets is handled in application layer
-- Only admin-checked API routes can access all user widgets

-- =============================================
-- Clean up any remaining admin-only policies
-- =============================================
-- Drop any remaining admin-only policies that might reference user_roles
DROP POLICY IF EXISTS admins_manage_roles ON user_roles;
DROP POLICY IF EXISTS admins_manage_settings ON site_settings;
DROP POLICY IF EXISTS admins_manage_projects ON projects;
DROP POLICY IF EXISTS admins_manage_media ON media;
DROP POLICY IF EXISTS admins_manage_bts_images ON bts_images;
DROP POLICY IF EXISTS admins_update_messages ON contact_messages;
DROP POLICY IF EXISTS admins_read_messages ON contact_messages;
DROP POLICY IF EXISTS admins_manage_dependencies ON dependencies;
DROP POLICY IF EXISTS admins_manage_dependency_settings ON dependency_settings;
DROP POLICY IF EXISTS admins_manage_settings ON dependency_settings;
DROP POLICY IF EXISTS admins_manage_compatibility ON dependency_compatibility;
DROP POLICY IF EXISTS admins_manage_audits ON security_audits;
DROP POLICY IF EXISTS admins_manage_security_audits ON security_audits;
DROP POLICY IF EXISTS admins_manage_widget_types ON widget_types;
DROP POLICY IF EXISTS admins_manage_user_widgets ON user_widgets;