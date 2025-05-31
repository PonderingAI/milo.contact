-- ====================================================================
-- RLS POLICY MIGRATION SCRIPT
-- ====================================================================
-- This script fixes Row Level Security (RLS) policies by adding WITH CHECK clauses
-- to existing policies that only have USING clauses. This ensures that INSERT and
-- UPDATE operations work properly with RLS enabled.
--
-- Run this script in the Supabase SQL Editor to fix authentication issues
-- with BTS images and other tables.
-- ====================================================================

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ====================================================================
-- FIX USER_ROLES TABLE POLICIES
-- ====================================================================
DO $$
BEGIN
  -- Drop existing policies
  DROP POLICY IF EXISTS "users_read_own_roles" ON user_roles;
  DROP POLICY IF EXISTS "admins_manage_roles" ON user_roles;
  
  -- Recreate with proper WITH CHECK clauses
  CREATE POLICY "users_read_own_roles"
  ON user_roles
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());
  
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
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'Error fixing user_roles policies: %', SQLERRM;
END $$;

-- ====================================================================
-- FIX SITE_SETTINGS TABLE POLICIES
-- ====================================================================
DO $$
BEGIN
  -- Drop existing policies
  DROP POLICY IF EXISTS "public_read_settings" ON site_settings;
  DROP POLICY IF EXISTS "admins_manage_settings" ON site_settings;
  
  -- Recreate with proper WITH CHECK clauses
  CREATE POLICY "public_read_settings"
  ON site_settings
  FOR SELECT
  TO public
  USING (true);
  
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
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'Error fixing site_settings policies: %', SQLERRM;
END $$;

-- ====================================================================
-- FIX PROJECTS TABLE POLICIES
-- ====================================================================
DO $$
BEGIN
  -- Drop existing policies
  DROP POLICY IF EXISTS "public_read_projects" ON projects;
  DROP POLICY IF EXISTS "admins_manage_projects" ON projects;
  
  -- Recreate with proper WITH CHECK clauses
  CREATE POLICY "public_read_projects"
  ON projects
  FOR SELECT
  TO public
  USING (is_public = true OR auth.uid() IS NOT NULL);
  
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
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'Error fixing projects policies: %', SQLERRM;
END $$;

-- ====================================================================
-- FIX MEDIA TABLE POLICIES
-- ====================================================================
DO $$
BEGIN
  -- Drop existing policies
  DROP POLICY IF EXISTS "public_read_media" ON media;
  DROP POLICY IF EXISTS "admins_manage_media" ON media;
  
  -- Recreate with proper WITH CHECK clauses
  CREATE POLICY "public_read_media"
  ON media
  FOR SELECT
  TO public
  USING (true);
  
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
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'Error fixing media policies: %', SQLERRM;
END $$;

-- ====================================================================
-- FIX BTS_IMAGES TABLE POLICIES
-- ====================================================================
DO $$
BEGIN
  -- Drop existing policies
  DROP POLICY IF EXISTS "public_read_bts_images" ON bts_images;
  DROP POLICY IF EXISTS "admins_manage_bts_images" ON bts_images;
  
  -- Recreate with proper WITH CHECK clauses
  CREATE POLICY "public_read_bts_images"
  ON bts_images
  FOR SELECT
  TO public
  USING (true);
  
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
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'Error fixing bts_images policies: %', SQLERRM;
END $$;

-- ====================================================================
-- FIX CONTACT_MESSAGES TABLE POLICIES
-- ====================================================================
DO $$
BEGIN
  -- Drop existing policies
  DROP POLICY IF EXISTS "public_insert_messages" ON contact_messages;
  DROP POLICY IF EXISTS "admins_read_messages" ON contact_messages;
  DROP POLICY IF EXISTS "admins_update_messages" ON contact_messages;
  
  -- Recreate with proper WITH CHECK clauses
  CREATE POLICY "public_insert_messages"
  ON contact_messages
  FOR INSERT
  TO public
  WITH CHECK (true);
  
  CREATE POLICY "admins_read_messages"
  ON contact_messages
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid() 
      AND role = 'admin'
    )
  );
  
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
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'Error fixing contact_messages policies: %', SQLERRM;
END $$;

-- ====================================================================
-- FIX DEPENDENCIES TABLE POLICIES
-- ====================================================================
DO $$
BEGIN
  -- Drop existing policies
  DROP POLICY IF EXISTS "authenticated_read_dependencies" ON dependencies;
  DROP POLICY IF EXISTS "admins_manage_dependencies" ON dependencies;
  
  -- Recreate with proper WITH CHECK clauses
  CREATE POLICY "authenticated_read_dependencies"
  ON dependencies
  FOR SELECT
  TO authenticated
  USING (true);
  
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
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'Error fixing dependencies policies: %', SQLERRM;
END $$;

-- ====================================================================
-- FIX DEPENDENCY_SETTINGS TABLE POLICIES
-- ====================================================================
DO $$
BEGIN
  -- Drop existing policies
  DROP POLICY IF EXISTS "authenticated_read_settings" ON dependency_settings;
  DROP POLICY IF EXISTS "admins_manage_settings" ON dependency_settings;
  DROP POLICY IF EXISTS "admins_manage_dep_settings" ON dependency_settings;
  
  -- Recreate with proper WITH CHECK clauses
  CREATE POLICY "authenticated_read_settings"
  ON dependency_settings
  FOR SELECT
  TO authenticated
  USING (true);
  
  CREATE POLICY "admins_manage_dep_settings"
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
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'Error fixing dependency_settings policies: %', SQLERRM;
END $$;

-- ====================================================================
-- FIX DEPENDENCY_COMPATIBILITY TABLE POLICIES
-- ====================================================================
DO $$
BEGIN
  -- Drop existing policies
  DROP POLICY IF EXISTS "authenticated_read_compatibility" ON dependency_compatibility;
  DROP POLICY IF EXISTS "admins_manage_compatibility" ON dependency_compatibility;
  
  -- Recreate with proper WITH CHECK clauses
  CREATE POLICY "authenticated_read_compatibility"
  ON dependency_compatibility
  FOR SELECT
  TO authenticated
  USING (true);
  
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
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'Error fixing dependency_compatibility policies: %', SQLERRM;
END $$;

-- ====================================================================
-- FIX SECURITY_AUDITS TABLE POLICIES
-- ====================================================================
DO $$
BEGIN
  -- Drop existing policies
  DROP POLICY IF EXISTS "authenticated_read_audits" ON security_audits;
  DROP POLICY IF EXISTS "admins_manage_audits" ON security_audits;
  
  -- Recreate with proper WITH CHECK clauses
  CREATE POLICY "authenticated_read_audits"
  ON security_audits
  FOR SELECT
  TO authenticated
  USING (true);
  
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
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'Error fixing security_audits policies: %', SQLERRM;
END $$;

-- ====================================================================
-- FIX WIDGET_TYPES TABLE POLICIES
-- ====================================================================
DO $$
BEGIN
  -- Drop existing policies
  DROP POLICY IF EXISTS "public_read_widget_types" ON widget_types;
  DROP POLICY IF EXISTS "admins_manage_widget_types" ON widget_types;
  
  -- Recreate with proper WITH CHECK clauses
  CREATE POLICY "public_read_widget_types"
  ON widget_types
  FOR SELECT
  TO public
  USING (true);
  
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
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'Error fixing widget_types policies: %', SQLERRM;
END $$;

-- ====================================================================
-- FIX USER_WIDGETS TABLE POLICIES
-- ====================================================================
DO $$
BEGIN
  -- Drop existing policies
  DROP POLICY IF EXISTS "public_read_user_widgets" ON user_widgets;
  DROP POLICY IF EXISTS "admins_manage_user_widgets" ON user_widgets;
  
  -- Recreate with proper WITH CHECK clauses
  CREATE POLICY "public_read_user_widgets"
  ON user_widgets
  FOR SELECT
  TO public
  USING (true);
  
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
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'Error fixing user_widgets policies: %', SQLERRM;
END $$;

-- ====================================================================
-- ENSURE ADMIN USER HAS ADMIN ROLE
-- ====================================================================
DO $$
DECLARE
  admin_user_id UUID;
BEGIN
  -- Insert admin role for the current user if they are a superAdmin in Clerk
  -- This helps bootstrap the system for the first admin
  INSERT INTO user_roles (user_id, role)
  VALUES (auth.uid(), 'admin')
  ON CONFLICT (user_id, role) DO NOTHING;
  
  -- If a specific admin user ID is known, you can uncomment and modify this:
  -- admin_user_id := 'a769e21a-3250-4341-9ed5-b2b00d74c3b1'; -- Replace with actual admin ID
  -- INSERT INTO user_roles (user_id, role)
  -- VALUES (admin_user_id, 'admin')
  -- ON CONFLICT (user_id, role) DO NOTHING;
  
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'Error ensuring admin role: %', SQLERRM;
END $$;

-- ====================================================================
-- VERIFY SETUP
-- ====================================================================
-- Run these queries to verify the changes
/*
-- Check if policies have been created with WITH CHECK clauses
SELECT 
  schemaname, 
  tablename, 
  policyname, 
  permissive, 
  roles, 
  cmd, 
  qual, 
  with_check
FROM pg_policies 
WHERE tablename = 'bts_images'
ORDER BY tablename, policyname;

-- Check if the current user has admin role
SELECT * FROM user_roles WHERE user_id = auth.uid();
*/
