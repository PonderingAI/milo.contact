-- Fix RLS Policies Migration Script
-- This script addresses multiple issues:
-- 1. Changes user_id column type in user_roles from UUID to TEXT for Clerk compatibility.
-- 2. Adds missing WITH CHECK clauses to RLS policies for proper INSERT/UPDATE operations.
-- It is designed to be safe to run on existing data and won't cause any data loss.
-- It only modifies policies and the user_roles table schema, not other tables or their data.

-- Enable UUID extension if not already enabled (required for some tables)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================
-- Fix user_roles table: Change user_id from UUID to TEXT
-- This is crucial for Clerk compatibility as Clerk user IDs are strings.
-- This process is designed to be data-safe.
-- =============================================
DO $$
BEGIN
    -- Drop policies that depend on the user_id column or user_roles table
    DROP POLICY IF EXISTS admins_manage_roles ON user_roles;
    DROP POLICY IF EXISTS users_read_own_roles ON user_roles;

    -- Drop the unique constraint that includes user_id
    -- The constraint name is typically 'tablename_columnname_columnname_key'
    ALTER TABLE user_roles DROP CONSTRAINT IF EXISTS user_roles_user_id_role_key;

    -- Rename the old user_id column
    ALTER TABLE user_roles RENAME COLUMN user_id TO old_user_id_uuid;

    -- Add the new user_id column as TEXT
    ALTER TABLE user_roles ADD COLUMN user_id TEXT;

    -- Copy data from the old column to the new one, casting UUIDs to TEXT
    -- This preserves existing user_id data.
    UPDATE user_roles SET user_id = old_user_id_uuid::TEXT;

    -- Set the new user_id column as NOT NULL
    ALTER TABLE user_roles ALTER COLUMN user_id SET NOT NULL;

    -- Drop the old user_id column
    ALTER TABLE user_roles DROP COLUMN old_user_id_uuid;

    -- Recreate the unique constraint on the new user_id and role columns
    ALTER TABLE user_roles ADD CONSTRAINT user_roles_user_id_role_key UNIQUE (user_id, role);
END $$;

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
