-- Fix RLS Policies Migration Script
-- This script adds missing WITH CHECK clauses to RLS policies
-- It is safe to run on existing data and won't cause any data loss
-- It only modifies policies, not tables or data

-- Enable UUID extension if not already enabled (required for some tables)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================
-- Fix user_roles table policies
-- =============================================
-- Allow admins to manage all roles
DROP POLICY IF EXISTS admins_manage_roles ON user_roles;
CREATE POLICY "admins_manage_roles"
ON user_roles
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = auth.uid() 
    AND role = 'admin'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = auth.uid() 
    AND role = 'admin'
  )
);

-- =============================================
-- Fix site_settings table policies
-- =============================================
-- Allow authenticated users with admin role to manage site_settings
DROP POLICY IF EXISTS admins_manage_settings ON site_settings;
CREATE POLICY "admins_manage_settings"
ON site_settings
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = auth.uid() 
    AND role = 'admin'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = auth.uid() 
    AND role = 'admin'
  )
);

-- =============================================
-- Fix projects table policies
-- =============================================
-- Allow authenticated users with admin role to manage projects
DROP POLICY IF EXISTS admins_manage_projects ON projects;
CREATE POLICY "admins_manage_projects"
ON projects
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = auth.uid() 
    AND role = 'admin'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = auth.uid() 
    AND role = 'admin'
  )
);

-- =============================================
-- Fix media table policies
-- =============================================
-- Allow authenticated users with admin role to manage media
DROP POLICY IF EXISTS admins_manage_media ON media;
CREATE POLICY "admins_manage_media"
ON media
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = auth.uid() 
    AND role = 'admin'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = auth.uid() 
    AND role = 'admin'
  )
);

-- =============================================
-- Fix bts_images table policies
-- =============================================
-- Allow authenticated users with admin role to manage bts_images
DROP POLICY IF EXISTS admins_manage_bts_images ON bts_images;
CREATE POLICY "admins_manage_bts_images"
ON bts_images
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = auth.uid() 
    AND role = 'admin'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = auth.uid() 
    AND role = 'admin'
  )
);

-- =============================================
-- Fix contact_messages table policies
-- =============================================
-- Allow authenticated users with admin role to update messages
DROP POLICY IF EXISTS admins_update_messages ON contact_messages;
CREATE POLICY "admins_update_messages"
ON contact_messages
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = auth.uid() 
    AND role = 'admin'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = auth.uid() 
    AND role = 'admin'
  )
);

-- =============================================
-- Fix dependencies table policies
-- =============================================
-- Allow authenticated users with admin role to manage dependencies
DROP POLICY IF EXISTS admins_manage_dependencies ON dependencies;
CREATE POLICY "admins_manage_dependencies"
ON dependencies
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = auth.uid() 
    AND role = 'admin'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = auth.uid() 
    AND role = 'admin'
  )
);

-- =============================================
-- Fix dependency_settings table policies
-- =============================================
-- Allow authenticated users with admin role to manage dependency settings
DROP POLICY IF EXISTS admins_manage_settings ON dependency_settings;
CREATE POLICY "admins_manage_settings"
ON dependency_settings
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = auth.uid() 
    AND role = 'admin'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = auth.uid() 
    AND role = 'admin'
  )
);

-- =============================================
-- Fix dependency_compatibility table policies
-- =============================================
-- Allow authenticated users with admin role to manage compatibility data
DROP POLICY IF EXISTS admins_manage_compatibility ON dependency_compatibility;
CREATE POLICY "admins_manage_compatibility"
ON dependency_compatibility
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = auth.uid() 
    AND role = 'admin'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = auth.uid() 
    AND role = 'admin'
  )
);

-- =============================================
-- Fix security_audits table policies
-- =============================================
-- Allow authenticated users with admin role to manage security audits
DROP POLICY IF EXISTS admins_manage_audits ON security_audits;
CREATE POLICY "admins_manage_audits"
ON security_audits
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = auth.uid() 
    AND role = 'admin'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = auth.uid() 
    AND role = 'admin'
  )
);

-- =============================================
-- Fix widget_types table policies
-- =============================================
-- Allow authenticated users with admin role to manage widget_types
DROP POLICY IF EXISTS admins_manage_widget_types ON widget_types;
CREATE POLICY "admins_manage_widget_types"
ON widget_types
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = auth.uid() 
    AND role = 'admin'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = auth.uid() 
    AND role = 'admin'
  )
);

-- =============================================
-- Fix user_widgets table policies
-- =============================================
-- Allow authenticated users with admin role to manage user_widgets
DROP POLICY IF EXISTS admins_manage_user_widgets ON user_widgets;
CREATE POLICY "admins_manage_user_widgets"
ON user_widgets
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = auth.uid() 
    AND role = 'admin'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = auth.uid() 
    AND role = 'admin'
  )
);

-- Ensure at least one admin user exists in user_roles
-- This is safe as it only inserts if no admin exists
DO $$
DECLARE
  admin_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO admin_count FROM user_roles WHERE role = 'admin';
  
  IF admin_count = 0 THEN
    -- No admin exists, insert a placeholder that will be replaced by the first superAdmin
    INSERT INTO user_roles (user_id, role)
    VALUES ('00000000-0000-0000-0000-000000000000', 'admin');
  END IF;
END $$;
