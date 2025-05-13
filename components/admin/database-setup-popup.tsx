"use client"

import { useEffect } from "react"
import { useState, useCallback, useRef } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { AlertCircle, Copy, Check, Database, RefreshCw, X, Trash2 } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { toast } from "@/components/ui/use-toast"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"

// Define the table configuration type
interface TableConfig {
  name: string
  displayName: string
  description: string
  sql: string
  dependencies: string[]
  required: boolean
  category: "core" | "content" | "media" | "security" | "dependencies" | "other"
}

// Define the props for the component
interface DatabaseSetupPopupProps {
  requiredSections?: string[]
  customTables?: string[]
  adminOnly?: boolean
  onSetupComplete?: () => void
  title?: string
  description?: string
  isStationary?: boolean
}

export function DatabaseSetupPopup({
  requiredSections = [],
  customTables = [],
  adminOnly = true,
  onSetupComplete,
  title = "Database Setup Required",
  description = "Some required database tables are missing. Please set up the database to continue.",
  isStationary = false,
}: DatabaseSetupPopupProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [checking, setChecking] = useState(false)
  const [copied, setCopied] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [missingTables, setMissingTables] = useState<string[]>([])
  const [existingTables, setExistingTables] = useState<string[]>([])
  const [selectedTables, setSelectedTables] = useState<string[]>([])
  const [tablesToDelete, setTablesToDelete] = useState<string[]>([])
  const [activeTab, setActiveTab] = useState<string>("create")
  const [setupCompleted, setSetupCompleted] = useState(false)
  const [forceClose, setForceClose] = useState(false)
  const [isAdminPage, setIsAdminPage] = useState(false)
  const [generatedSQL, setGeneratedSQL] = useState<string>("")
  const [initialCheckDone, setInitialCheckDone] = useState(false)
  const [lastRefreshTime, setLastRefreshTime] = useState<Date | null>(null)
  const supabase = createClientComponentClient()

  // Use a ref to prevent multiple simultaneous checks
  const isCheckingRef = useRef(false)

  // Define all possible tables with their SQL
  const allTables: TableConfig[] = [
    {
      name: "user_roles",
      displayName: "User Roles",
      description: "Stores user roles and permissions",
      sql: `
CREATE TABLE IF NOT EXISTS user_roles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL,
  role TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, role)
);

-- Add RLS policies
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to read their own roles
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'user_roles' AND policyname = 'users_read_own_roles'
  ) THEN
    CREATE POLICY "users_read_own_roles"
    ON user_roles
    FOR SELECT
    TO authenticated
    USING (user_id = auth.uid());
  END IF;
EXCEPTION WHEN OTHERS THEN
  -- Policy already exists or other error
END $$;

-- Allow admins to manage all roles
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'user_roles' AND policyname = 'admins_manage_roles'
  ) THEN
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
    );
  END IF;
EXCEPTION WHEN OTHERS THEN
  -- Policy already exists or other error
END $$;`,
      dependencies: [],
      required: true,
      category: "core",
    },
    {
      name: "site_settings",
      displayName: "Site Settings",
      description: "Stores site-wide settings and configuration",
      sql: `
CREATE TABLE IF NOT EXISTS site_settings (
  id SERIAL PRIMARY KEY,
  key TEXT UNIQUE NOT NULL,
  value TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add RLS policies
ALTER TABLE site_settings ENABLE ROW LEVEL SECURITY;

-- Allow public read access
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'site_settings' AND policyname = 'public_read_settings'
  ) THEN
    CREATE POLICY "public_read_settings"
    ON site_settings
    FOR SELECT
    TO public
    USING (true);
  END IF;
EXCEPTION WHEN OTHERS THEN
  -- Policy already exists or other error
END $$;

-- Allow authenticated users with admin role to manage site_settings
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'site_settings' AND policyname = 'admins_manage_settings'
  ) THEN
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
    );
  END IF;
EXCEPTION WHEN OTHERS THEN
  -- Policy already exists or other error
END $$;

-- Insert default settings
INSERT INTO site_settings (key, value)
VALUES 
  ('site_title', 'My Portfolio'),
  ('site_description', 'My professional portfolio website'),
  ('hero_heading', 'Welcome to my portfolio'),
  ('hero_subheading', 'Check out my latest projects')
ON CONFLICT (key) DO NOTHING;`,
      dependencies: ["user_roles"],
      required: true,
      category: "core",
    },
    {
      name: "projects",
      displayName: "Projects",
      description: "Stores project information and metadata",
      sql: `
CREATE TABLE IF NOT EXISTS projects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT,
  content TEXT,
  image TEXT,
  thumbnail_url TEXT,
  category TEXT,
  type TEXT,
  role TEXT,
  date DATE,
  project_date DATE,
  client TEXT,
  url TEXT,
  featured BOOLEAN DEFAULT false,
  is_public BOOLEAN DEFAULT true,
  publish_date TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add project_date column if it doesn't exist (for existing tables)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'projects' AND column_name = 'project_date'
  ) THEN
    ALTER TABLE projects ADD COLUMN project_date DATE;
  END IF;
END $$;

-- Add is_public column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'projects' AND column_name = 'is_public'
  ) THEN
    ALTER TABLE projects ADD COLUMN is_public BOOLEAN DEFAULT true;
  END IF;
END $$;

-- Add publish_date column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'projects' AND column_name = 'publish_date'
  ) THEN
    ALTER TABLE projects ADD COLUMN publish_date TIMESTAMP WITH TIME ZONE;
  END IF;
END $$;

-- Create indexes for faster filtering
CREATE INDEX IF NOT EXISTS idx_projects_is_public ON projects(is_public);
CREATE INDEX IF NOT EXISTS idx_projects_publish_date ON projects(publish_date);

-- Add RLS policies
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

-- Allow public read access only for public projects
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'projects' AND policyname = 'public_read_projects'
  ) THEN
    CREATE POLICY "public_read_projects"
    ON projects
    FOR SELECT
    TO public
    USING (is_public = true OR auth.uid() IS NOT NULL);
  END IF;
EXCEPTION WHEN OTHERS THEN
  -- Policy already exists or other error
END $$;

-- Allow authenticated users with admin role to manage projects
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'projects' AND policyname = 'admins_manage_projects'
  ) THEN
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
    );
  END IF;
EXCEPTION WHEN OTHERS THEN
  -- Policy already exists or other error
END $$;`,
      dependencies: ["user_roles"],
      required: false,
      category: "content",
    },
    {
      name: "media",
      displayName: "Media Library",
      description: "Stores uploaded media files metadata",
      sql: `
CREATE TABLE IF NOT EXISTS media (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  filename TEXT NOT NULL,
  filepath TEXT NOT NULL,
  filesize INTEGER,
  filetype TEXT,
  width INTEGER,
  height INTEGER,
  alt_text TEXT,
  title TEXT,
  description TEXT,
  uploaded_by UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add RLS policies
ALTER TABLE media ENABLE ROW LEVEL SECURITY;

-- Allow public read access
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'media' AND policyname = 'public_read_media'
  ) THEN
    CREATE POLICY "public_read_media"
    ON media
    FOR SELECT
    TO public
    USING (true);
  END IF;
EXCEPTION WHEN OTHERS THEN
  -- Policy already exists or other error
END $$;

-- Allow authenticated users with admin role to manage media
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'media' AND policyname = 'admins_manage_media'
  ) THEN
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
    );
  END IF;
EXCEPTION WHEN OTHERS THEN
  -- Policy already exists or other error
END $$;`,
      dependencies: ["user_roles"],
      required: false,
      category: "media",
    },
    {
      name: "bts_images",
      displayName: "Behind-the-Scenes Images",
      description: "Stores behind-the-scenes images for projects",
      sql: `
CREATE TABLE IF NOT EXISTS bts_images (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  caption TEXT,
  sort_order INTEGER DEFAULT 0,
  category TEXT DEFAULT 'general',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add RLS policies
ALTER TABLE bts_images ENABLE ROW LEVEL SECURITY;

-- Allow public read access
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'bts_images' AND policyname = 'public_read_bts_images'
  ) THEN
    CREATE POLICY "public_read_bts_images"
    ON bts_images
    FOR SELECT
    TO public
    USING (true);
  END IF;
EXCEPTION WHEN OTHERS THEN
  -- Policy already exists or other error
END $$;

-- Allow authenticated users with admin role to manage bts_images
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'bts_images' AND policyname = 'admins_manage_bts_images'
  ) THEN
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
    );
  END IF;
EXCEPTION WHEN OTHERS THEN
  -- Policy already exists or other error
END $$;`,
      dependencies: ["projects", "user_roles"],
      required: false,
      category: "content",
    },
    {
      name: "contact_messages",
      displayName: "Contact Messages",
      description: "Stores contact form submissions",
      sql: `
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
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'contact_messages' AND policyname = 'public_insert_messages'
  ) THEN
    CREATE POLICY "public_insert_messages"
    ON contact_messages
    FOR INSERT
    TO public
    WITH CHECK (true);
  END IF;
EXCEPTION WHEN OTHERS THEN
  -- Policy already exists or other error
END $$;

-- Allow authenticated users with admin role to read all messages
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'contact_messages' AND policyname = 'admins_read_messages'
  ) THEN
    CREATE POLICY "admins_read_messages"
    ON contact_messages
    FOR SELECT
    USING (
      EXISTS (
        SELECT 1 FROM user_roles
        WHERE user_id = auth.uid() 
        AND role = 'admin'
      )
    );
  END IF;
EXCEPTION WHEN OTHERS THEN
  -- Policy already exists or other error
END $$;

-- Allow authenticated users with admin role to update messages
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'contact_messages' AND policyname = 'admins_update_messages'
  ) THEN
    CREATE POLICY "admins_update_messages"
    ON contact_messages
    FOR UPDATE
    USING (
      EXISTS (
        SELECT 1 FROM user_roles
        WHERE user_id = auth.uid() 
        AND role = 'admin'
      )
    );
  END IF;
EXCEPTION WHEN OTHERS THEN
  -- Policy already exists or other error
END $$;

-- Create an index on created_at for sorting
CREATE INDEX IF NOT EXISTS idx_contact_messages_created_at
ON contact_messages(created_at DESC);

-- Create an index on read status for filtering
CREATE INDEX IF NOT EXISTS idx_contact_messages_read
ON contact_messages(read);`,
      dependencies: ["user_roles"],
      required: false,
      category: "content",
    },
    {
      name: "dependencies",
      displayName: "Dependencies",
      description: "Stores information about project dependencies",
      sql: `
CREATE TABLE IF NOT EXISTS dependencies (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL UNIQUE,
  current_version VARCHAR(100) NOT NULL,
  latest_version VARCHAR(100),
  locked BOOLEAN DEFAULT FALSE,
  locked_version VARCHAR(100),
  update_mode VARCHAR(50) DEFAULT 'global',
  last_checked TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  has_security_update BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add RLS policies
ALTER TABLE dependencies ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to read dependencies
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'dependencies' AND policyname = 'authenticated_read_dependencies'
  ) THEN
    CREATE POLICY "authenticated_read_dependencies"
    ON dependencies
    FOR SELECT
    TO authenticated
    USING (true);
  END IF;
EXCEPTION WHEN OTHERS THEN
  -- Policy already exists or other error
END $$;

-- Allow authenticated users with admin role to manage dependencies
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'dependencies' AND policyname = 'admins_manage_dependencies'
  ) THEN
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
    );
  END IF;
EXCEPTION WHEN OTHERS THEN
  -- Policy already exists or other error
END $$;`,
      dependencies: ["user_roles"],
      required: false,
      category: "dependencies",
    },
    {
      name: "dependency_settings",
      displayName: "Dependency Settings",
      description: "Stores settings for dependency management",
      sql: `
CREATE TABLE IF NOT EXISTS dependency_settings (
  id SERIAL PRIMARY KEY,
  update_mode VARCHAR(50) DEFAULT 'aggressive',
  auto_update_enabled BOOLEAN DEFAULT TRUE,
  update_schedule VARCHAR(100) DEFAULT 'daily',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default settings
INSERT INTO dependency_settings (update_mode, auto_update_enabled, update_schedule)
VALUES ('aggressive', TRUE, 'daily')
ON CONFLICT DO NOTHING;

-- Add RLS policies
ALTER TABLE dependency_settings ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to read dependency settings
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'dependency_settings' AND policyname = 'authenticated_read_settings'
  ) THEN
    CREATE POLICY "authenticated_read_settings"
    ON dependency_settings
    FOR SELECT
    TO authenticated
    USING (true);
  END IF;
EXCEPTION WHEN OTHERS THEN
  -- Policy already exists or other error
END $$;

-- Allow authenticated users with admin role to manage dependency settings
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'dependency_settings' AND policyname = 'admins_manage_settings'
  ) THEN
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
    );
  END IF;
EXCEPTION WHEN OTHERS THEN
  -- Policy already exists or other error
END $$;`,
      dependencies: ["user_roles"],
      required: false,
      category: "dependencies",
    },
    {
      name: "dependency_compatibility",
      displayName: "Dependency Compatibility",
      description: "Stores compatibility information between dependencies",
      sql: `
CREATE TABLE IF NOT EXISTS dependency_compatibility (
  id SERIAL PRIMARY KEY,
  dependency_name VARCHAR(255) NOT NULL,
  compatible_with VARCHAR(255) NOT NULL,
  min_version VARCHAR(100),
  max_version VARCHAR(100),
  notes TEXT,
  source VARCHAR(100),
  verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(dependency_name, compatible_with)
);

-- Add RLS policies
ALTER TABLE dependency_compatibility ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to read compatibility data
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'dependency_compatibility' AND policyname = 'authenticated_read_compatibility'
  ) THEN
    CREATE POLICY "authenticated_read_compatibility"
    ON dependency_compatibility
    FOR SELECT
    TO authenticated
    USING (true);
  END IF;
EXCEPTION WHEN OTHERS THEN
  -- Policy already exists or other error
END $$;

-- Allow authenticated users with admin role to manage compatibility data
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'dependency_compatibility' AND policyname = 'admins_manage_compatibility'
  ) THEN
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
    );
  END IF;
EXCEPTION WHEN OTHERS THEN
  -- Policy already exists or other error
END $$;`,
      dependencies: ["user_roles"],
      required: false,
      category: "dependencies",
    },
    {
      name: "security_audits",
      displayName: "Security Audits",
      description: "Stores security audit results",
      sql: `
CREATE TABLE IF NOT EXISTS security_audits (
  id SERIAL PRIMARY KEY,
  audit_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  vulnerabilities_found INTEGER DEFAULT 0,
  packages_scanned INTEGER DEFAULT 0,
  security_score INTEGER DEFAULT 100,
  audit_summary JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add RLS policies
ALTER TABLE security_audits ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to read security audits
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'security_audits' AND policyname = 'authenticated_read_audits'
  ) THEN
    CREATE POLICY "authenticated_read_audits"
    ON security_audits
    FOR SELECT
    TO authenticated
    USING (true);
  END IF;
EXCEPTION WHEN OTHERS THEN
  -- Policy already exists or other error
END $$;

-- Allow authenticated users with admin role to manage security audits
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'security_audits' AND policyname = 'admins_manage_audits'
  ) THEN
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
    );
  END IF;
EXCEPTION WHEN OTHERS THEN
  -- Policy already exists or other error
END $$;`,
      dependencies: ["user_roles"],
      required: false,
      category: "security",
    },
    {
      name: "widget_types",
      displayName: "Widget Types",
      description: "Stores available widget types for the page builder",
      sql: `
CREATE TABLE IF NOT EXISTS widget_types (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL UNIQUE,
  description TEXT,
  icon TEXT,
  component_name VARCHAR(255) NOT NULL,
  default_props JSONB,
  category VARCHAR(100),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add RLS policies
ALTER TABLE widget_types ENABLE ROW LEVEL SECURITY;

-- Allow public read access
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'widget_types' AND policyname = 'public_read_widget_types'
  ) THEN
    CREATE POLICY "public_read_widget_types"
    ON widget_types
    FOR SELECT
    TO public
    USING (true);
  END IF;
EXCEPTION WHEN OTHERS THEN
  -- Policy already exists or other error
END $$;

-- Allow authenticated users with admin role to manage widget_types
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'widget_types' AND policyname = 'admins_manage_widget_types'
  ) THEN
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
    );
  END IF;
EXCEPTION WHEN OTHERS THEN
  -- Policy already exists or other error
END $$;

-- Insert some default widget types
INSERT INTO widget_types (name, description, icon, component_name, default_props, category)
VALUES 
  ('Heading', 'A heading text widget', 'type', 'HeadingWidget', '{"text": "Heading", "level": 2}', 'text'),
  ('Paragraph', 'A paragraph text widget', 'text', 'ParagraphWidget', '{"text": "Enter your text here"}', 'text'),
  ('Image', 'An image widget', 'image', 'ImageWidget', '{"src": "", "alt": ""}', 'media'),
  ('Button', 'A button widget', 'mouse-pointer', 'ButtonWidget', '{"text": "Click me", "url": "#"}', 'interactive')
ON CONFLICT (name) DO NOTHING;`,
      dependencies: ["user_roles"],
      required: false,
      category: "other",
    },
    {
      name: "user_widgets",
      displayName: "User Widgets",
      description: "Stores user-created widget instances",
      sql: `
CREATE TABLE IF NOT EXISTS user_widgets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  page_id UUID NOT NULL,
  widget_type_id INTEGER REFERENCES widget_types(id) ON DELETE CASCADE,
  position INTEGER NOT NULL,
  props JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add RLS policies
ALTER TABLE user_widgets ENABLE ROW LEVEL SECURITY;

-- Allow public read access
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'user_widgets' AND policyname = 'public_read_user_widgets'
  ) THEN
    CREATE POLICY "public_read_user_widgets"
    ON user_widgets
    FOR SELECT
    TO public
    USING (true);
  END IF;
EXCEPTION WHEN OTHERS THEN
  -- Policy already exists or other error
END $$;

-- Allow authenticated users with admin role to manage user_widgets
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'user_widgets' AND policyname = 'admins_manage_user_widgets'
  ) THEN
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
    );
  END IF;
EXCEPTION WHEN OTHERS THEN
  -- Policy already exists or other error
END $$;

-- Create an index on page_id for faster lookups
CREATE INDEX IF NOT EXISTS idx_user_widgets_page_id
ON user_widgets(page_id);

-- Create an index on position for sorting
CREATE INDEX IF NOT EXISTS idx_user_widgets_position
ON user_widgets(position);`,
      dependencies: ["widget_types", "user_roles"],
      required: false,
      category: "other",
    },
  ]

  // Check if we're on an admin page
  useEffect(() => {
    if (typeof window !== "undefined") {
      const isAdmin = window.location.pathname.startsWith("/admin")
      setIsAdminPage(isAdmin)

      // If we're not on an admin page and adminOnly is true, force close
      if (!isAdmin && adminOnly) {
        setForceClose(true)
      }
    }
  }, [adminOnly])

  // Function to generate SQL for selected tables and tables to delete
  const generateSQL = useCallback(() => {
    let sql = ""

    // Add DROP TABLE statements for tables marked for deletion
    if (tablesToDelete.length > 0) {
      sql += `-- Drop tables marked for deletion\n`

      // Sort tables to ensure dependencies are respected (drop dependent tables first)
      const sortedTablesToDelete = [...tablesToDelete].sort((a, b) => {
        const tableA = allTables.find((t) => t.name === a)
        const tableB = allTables.find((t) => t.name === b)

        // If tableA depends on tableB, tableA should be dropped first
        if (tableA && tableB && tableA.dependencies.includes(b)) {
          return -1
        }
        // If tableB depends on tableA, tableB should be dropped first
        if (tableA && tableB && tableB.dependencies.includes(a)) {
          return 1
        }
        return 0
      })

      for (const tableName of sortedTablesToDelete) {
        sql += `DROP TABLE IF EXISTS ${tableName} CASCADE;\n`
      }
      sql += "\n"
    }

    // If there are tables to create
    if (selectedTables.length > 0) {
      // Start with UUID extension
      sql += `-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

`

      // Add SQL for each selected table, respecting dependencies
      const processedTables = new Set<string>()
      const processTable = (tableName: string) => {
        if (processedTables.has(tableName)) return

        // Process dependencies first
        const table = allTables.find((t) => t.name === tableName)
        if (table) {
          for (const dep of table.dependencies) {
            if (selectedTables.includes(dep)) {
              processTable(dep)
            }
          }

          // Add this table's SQL
          sql += `-- Setup for ${table.displayName} table\n`
          sql += table.sql
          sql += "\n\n"

          processedTables.add(tableName)
        }
      }

      // Process all selected tables
      for (const tableName of selectedTables) {
        processTable(tableName)
      }
    }

    return sql.trim()
  }, [selectedTables, tablesToDelete, allTables])

  // Update generated SQL whenever selected tables or tables to delete change
  useEffect(() => {
    const sql = generateSQL()
    setGeneratedSQL(sql)
  }, [selectedTables, tablesToDelete, generateSQL])

  // Function to check if tables exist - using direct Supabase queries
  const checkTablesWithSupabase = useCallback(async () => {
    if (checking) return // Prevent multiple simultaneous checks

    setChecking(true)
    setError(null)
    setLastRefreshTime(new Date())

    try {
      // Get all table names to check
      const allTableNames = allTables.map((table) => table.name)

      // Track missing and existing tables
      const missingTablesList: string[] = []
      const existingTablesList: string[] = []

      // Check each table individually
      for (const tableName of allTableNames) {
        try {
          // Try to select a single row from the table
          const { error } = await supabase.from(tableName).select("count").limit(1).single()

          if (error && (error.code === "PGRST116" || error.message.includes("does not exist"))) {
            // Table doesn't exist
            missingTablesList.push(tableName)
          } else {
            // Table exists
            existingTablesList.push(tableName)
          }
        } catch (err) {
          // If there's an error, assume the table doesn't exist
          console.warn(`Error checking table ${tableName}:`, err)
          missingTablesList.push(tableName)
        }
      }

      setMissingTables(missingTablesList)
      setExistingTables(existingTablesList)

      // Only set selected tables on initial load
      if (!initialCheckDone) {
        setSelectedTables(missingTablesList)
        setInitialCheckDone(true)
      }

      // Set the initial active tab based on what we found
      if (!initialCheckDone) {
        if (missingTablesList.length > 0) {
          setActiveTab("create")
        } else if (existingTablesList.length > 0) {
          setActiveTab("manage")
        }
      }

      // Only open the popup if there are missing tables and we're on an admin page
      if (missingTablesList.length > 0 && (isAdminPage || isStationary)) {
        setOpen(true)
      } else if (!isStationary) {
        setOpen(false)
        setSetupCompleted(true)
        if (onSetupComplete) {
          onSetupComplete()
        }
      }
    } catch (error) {
      console.error("Error checking tables:", error)
      setError(
        `Failed to check database tables: ${error instanceof Error ? error.message : "Unknown error"}. Please try again or use the Skip Setup button.`,
      )

      // If we can't check tables, don't show the popup on non-admin pages
      if (!isAdminPage && adminOnly) {
        setForceClose(true)
      }

      // In stationary mode, we still want to show the component even if there's an error
      if (isStationary) {
        // Show all tables as missing so the user can create them
        const allTableNames = allTables.map((table) => table.name)
        setMissingTables(allTableNames)
        if (!initialCheckDone) {
          setSelectedTables(allTableNames)
          setInitialCheckDone(true)
        }
        setExistingTables([])
        setOpen(true)
      }
    } finally {
      setChecking(false)
    }
  }, [allTables, checking, initialCheckDone, isAdminPage, isStationary, adminOnly, onSetupComplete, supabase])

  // Function to copy SQL to clipboard
  const copyToClipboard = () => {
    navigator.clipboard.writeText(generatedSQL)
    setCopied(true)
    toast({
      title: "SQL Copied",
      description: "SQL has been copied to clipboard",
    })
    setTimeout(() => setCopied(false), 3000)
  }

  // Function to execute SQL
  const executeSQL = async () => {
    setLoading(true)
    setError(null)
    setSuccess(null)

    try {
      // Use Supabase RPC to execute SQL directly
      const { error } = await supabase.rpc("exec_sql", {
        sql_query: generatedSQL,
      })

      if (error) {
        throw new Error(error.message || "Failed to execute SQL")
      }

      setSuccess("Database changes applied successfully!")
      toast({
        title: "Success",
        description: "Database changes applied successfully!",
      })

      // Wait a moment before refreshing
      setTimeout(() => {
        // Refresh the table list
        checkTablesWithSupabase()
      }, 1500)
    } catch (error) {
      console.error("Error executing SQL:", error)
      setError(error instanceof Error ? error.message : "An unexpected error occurred")
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "An unexpected error occurred",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  // Function to handle table selection for creation
  const handleTableSelection = (tableName: string, checked: boolean) => {
    if (checked) {
      setSelectedTables((prev) => [...prev, tableName])
    } else {
      setSelectedTables((prev) => prev.filter((t) => t !== tableName))
    }
  }

  // Function to handle table selection for deletion
  const handleTableDeletion = (tableName: string, checked: boolean) => {
    if (checked) {
      setTablesToDelete((prev) => [...prev, tableName])
    } else {
      setTablesToDelete((prev) => prev.filter((t) => t !== tableName))
    }
  }

  // Filter tables by category for creation
  const getFilteredTablesForCreation = () => {
    return allTables.filter((table) => missingTables.includes(table.name))
  }

  // Filter tables by category for management
  const getFilteredTablesForManagement = () => {
    return allTables.filter((table) => existingTables.includes(table.name))
  }

  // Handle force close
  const handleForceClose = () => {
    setForceClose(true)
    setOpen(false)
    setSetupCompleted(true)

    // Store in localStorage to prevent popup from showing again
    try {
      localStorage.setItem("database_setup_completed", "true")
    } catch (e) {
      console.error("Could not save to localStorage", e)
    }

    if (onSetupComplete) {
      onSetupComplete()
    }
  }

  // Handle manual setup completion
  const handleManualSetupComplete = () => {
    setSuccess("Setup marked as complete. Refreshing page...")

    // Store in localStorage to prevent popup from showing again
    try {
      localStorage.setItem("database_setup_completed", "true")
    } catch (e) {
      console.error("Could not save to localStorage", e)
    }

    // Wait a moment before closing to show success message
    setTimeout(() => {
      if (!isStationary) {
        setOpen(false)
      }
      setSetupCompleted(true)

      if (onSetupComplete) {
        onSetupComplete()
      }

      // Refresh the page to ensure everything is loaded correctly
      window.location.reload()
    }, 1500)
  }

  // Check for missing tables on component mount - only once
  useEffect(() => {
    // For stationary mode, always check tables
    if (isStationary && !initialCheckDone) {
      checkTablesWithSupabase()
      return
    }

    // If custom tables are provided, force check those tables
    if (customTables && customTables.length > 0) {
      setForceClose(false)
      setOpen(true)
      setMissingTables(customTables)
      setSelectedTables(customTables)
      setInitialCheckDone(true)
      return
    }

    // Check if setup was previously completed
    try {
      const completed = localStorage.getItem("database_setup_completed")
      if (completed === "true" && !isStationary && !customTables?.length) {
        setForceClose(true)
        setSetupCompleted(true)
        return
      }
    } catch (e) {
      console.error("Could not read from localStorage", e)
    }

    // Only run the check if we're on an admin page and adminOnly is true
    if ((!adminOnly || (adminOnly && isAdminPage)) && !initialCheckDone) {
      checkTablesWithSupabase()
    }
  }, [checkTablesWithSupabase, adminOnly, isAdminPage, isStationary, initialCheckDone, customTables])

  // If force closed, setup completed, or not on admin page when adminOnly is true, don't render
  if (forceClose || (setupCompleted && !open && !isStationary) || (adminOnly && !isAdminPage && !isStationary)) {
    return null
  }

  // If stationary, render the content directly without the Dialog wrapper
  if (isStationary) {
    return (
      <div className="w-full">
        <div className="flex items-center justify-between gap-2 mb-4">
          <div className="flex items-center">
            <Database className="h-5 w-5 mr-2" />
            <h2 className="text-xl font-semibold">{title}</h2>
          </div>
          <Button variant="outline" size="sm" onClick={checkTablesWithSupabase} disabled={checking}>
            <RefreshCw className={`h-4 w-4 mr-2 ${checking ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>
        <p className="text-sm text-muted-foreground mb-6">{description}</p>

        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {success && (
          <Alert
            variant="default"
            className="mb-4 bg-green-50 text-green-800 border-green-200 dark:bg-green-900 dark:text-green-100 dark:border-green-800"
          >
            <Check className="h-4 w-4" />
            <AlertDescription>{success}</AlertDescription>
          </Alert>
        )}

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium">Database Tables</h3>
            <div className="text-sm text-muted-foreground">
              {existingTables.length} existing / {missingTables.length} missing
            </div>
          </div>

          <Tabs defaultValue={activeTab} value={activeTab} onValueChange={setActiveTab}>
            <TabsList>
              {missingTables.length > 0 && <TabsTrigger value="create">Create Tables</TabsTrigger>}
              {existingTables.length > 0 && <TabsTrigger value="manage">Manage Tables</TabsTrigger>}
            </TabsList>

            {missingTables.length > 0 && (
              <TabsContent value="create" className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                  {getFilteredTablesForCreation().map((table) => (
                    <div key={table.name} className="flex items-start space-x-2 border p-3 rounded-md">
                      <Checkbox
                        id={`table-create-${table.name}`}
                        checked={selectedTables.includes(table.name)}
                        onCheckedChange={(checked) => handleTableSelection(table.name, checked === true)}
                        disabled={table.required}
                      />
                      <div className="space-y-1">
                        <Label htmlFor={`table-create-${table.name}`} className="font-medium cursor-pointer">
                          {table.displayName}
                          {table.required && <span className="text-red-500 ml-2">(Required)</span>}
                        </Label>
                        <p className="text-sm text-muted-foreground">{table.description}</p>
                        {table.dependencies.length > 0 && (
                          <p className="text-xs text-muted-foreground">Depends on: {table.dependencies.join(", ")}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </TabsContent>
            )}

            {existingTables.length > 0 && (
              <TabsContent value="manage" className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                  {getFilteredTablesForManagement().map((table) => (
                    <div key={table.name} className="flex items-start space-x-2 border p-3 rounded-md">
                      <Checkbox
                        id={`table-delete-${table.name}`}
                        checked={tablesToDelete.includes(table.name)}
                        onCheckedChange={(checked) => handleTableDeletion(table.name, checked === true)}
                        disabled={
                          table.required &&
                          existingTables.some((t) => {
                            const tableConfig = allTables.find((at) => at.name === t)
                            return tableConfig?.dependencies.includes(table.name) || false
                          })
                        }
                      />
                      <div className="space-y-1 flex-1">
                        <div className="flex items-center justify-between">
                          <Label htmlFor={`table-delete-${table.name}`} className="font-medium cursor-pointer">
                            {table.displayName}
                            {table.required && <span className="text-red-500 ml-2">(Required)</span>}
                          </Label>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleTableDeletion(table.name, !tablesToDelete.includes(table.name))}
                            disabled={
                              table.required &&
                              existingTables.some((t) => {
                                const tableConfig = allTables.find((at) => at.name === t)
                                return tableConfig?.dependencies.includes(table.name) || false
                              })
                            }
                            className="h-6 w-6 text-red-500 hover:text-red-700 hover:bg-red-100 dark:hover:bg-red-900"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                        <p className="text-sm text-muted-foreground">{table.description}</p>
                        {existingTables.some((t) => {
                          const tableConfig = allTables.find((at) => at.name === t)
                          return tableConfig?.dependencies.includes(table.name) || false
                        }) && (
                          <p className="text-xs text-amber-600 dark:text-amber-400">Other tables depend on this one</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </TabsContent>
            )}
          </Tabs>

          {(selectedTables.length > 0 || tablesToDelete.length > 0) && (
            <div className="mt-6">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-lg font-medium">Generated SQL</h3>
                <Button variant="outline" size="sm" onClick={copyToClipboard}>
                  {copied ? <Check className="mr-2 h-4 w-4" /> : <Copy className="mr-2 h-4 w-4" />}
                  {copied ? "Copied!" : "Copy SQL"}
                </Button>
              </div>
              <Textarea value={generatedSQL} readOnly className="h-64 font-mono text-sm bg-gray-50 dark:bg-gray-900" />
            </div>
          )}

          {(selectedTables.length > 0 || tablesToDelete.length > 0) && (
            <div className="bg-gray-100 dark:bg-gray-800 rounded-md p-4 mt-4">
              <h3 className="font-medium mb-2">Instructions:</h3>
              <ol className="list-decimal list-inside space-y-2">
                <li>Copy the SQL code above using the "Copy SQL" button</li>
                <li>Go to your Supabase project dashboard</li>
                <li>Click on "SQL Editor" in the left sidebar</li>
                <li>Paste the SQL code into the editor</li>
                <li>Click "Run" to execute the SQL and apply the changes</li>
                <li>Return here and click "I've Run the SQL Manually"</li>
              </ol>
            </div>
          )}

          {(selectedTables.length > 0 || tablesToDelete.length > 0) && (
            <div className="flex flex-col sm:flex-row gap-3 justify-end">
              <Button variant="outline" onClick={handleManualSetupComplete}>
                I've Run the SQL Manually
              </Button>
              <Button onClick={executeSQL} disabled={loading}>
                {loading ? "Applying changes..." : "Apply Changes Automatically"}
              </Button>
            </div>
          )}
        </div>
      </div>
    )
  }

  // For the popup version, wrap in Dialog
  return (
    <Dialog
      open={open}
      onOpenChange={(isOpen) => {
        // Only allow closing if we're not loading
        if (!loading) {
          setOpen(isOpen)
        }
      }}
    >
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between gap-2 text-xl">
            <div className="flex items-center">
              <Database className="h-5 w-5 mr-2" />
              {title}
            </div>
            <Button variant="ghost" size="icon" onClick={handleForceClose} title="Skip setup (not recommended)">
              <X className="h-4 w-4" />
            </Button>
          </DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {success && (
          <Alert
            variant="default"
            className="mb-4 bg-green-50 text-green-800 border-green-200 dark:bg-green-900 dark:text-green-100 dark:border-green-800"
          >
            <Check className="h-4 w-4" />
            <AlertDescription>{success}</AlertDescription>
          </Alert>
        )}

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium">Missing Tables</h3>
            <Button variant="outline" size="sm" onClick={checkTablesWithSupabase} disabled={checking}>
              <RefreshCw className={`h-4 w-4 mr-2 ${checking ? "animate-spin" : ""}`} />
              Refresh
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            {getFilteredTablesForCreation().map((table) => (
              <div key={table.name} className="flex items-start space-x-2 border p-3 rounded-md">
                <Checkbox
                  id={`table-${table.name}`}
                  checked={selectedTables.includes(table.name)}
                  onCheckedChange={(checked) => handleTableSelection(table.name, checked === true)}
                  disabled={table.required}
                />
                <div className="space-y-1">
                  <Label htmlFor={`table-${table.name}`} className="font-medium cursor-pointer">
                    {table.displayName}
                    {table.required && <span className="text-red-500 ml-2">(Required)</span>}
                  </Label>
                  <p className="text-sm text-muted-foreground">{table.description}</p>
                  {table.dependencies.length > 0 && (
                    <p className="text-xs text-muted-foreground">Depends on: {table.dependencies.join(", ")}</p>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-lg font-medium">Generated SQL</h3>
              <Button variant="outline" size="sm" onClick={copyToClipboard}>
                {copied ? <Check className="mr-2 h-4 w-4" /> : <Copy className="mr-2 h-4 w-4" />}
                {copied ? "Copied!" : "Copy SQL"}
              </Button>
            </div>
            <Textarea value={generatedSQL} readOnly className="h-64 font-mono text-sm bg-gray-50 dark:bg-gray-900" />
          </div>

          <div className="bg-gray-100 dark:bg-gray-800 rounded-md p-4 mt-4">
            <h3 className="font-medium mb-2">Instructions:</h3>
            <ol className="list-decimal list-inside space-y-2">
              <li>Copy the SQL code above using the "Copy SQL" button</li>
              <li>Go to your Supabase project dashboard</li>
              <li>Click on "SQL Editor" in the left sidebar</li>
              <li>Paste the SQL code into the editor</li>
              <li>Click "Run" to execute the SQL and create all required tables</li>
              <li>Return here and click "I've Run the SQL Manually"</li>
            </ol>
          </div>

          <DialogFooter className="flex flex-col sm:flex-row gap-3">
            <Button variant="outline" onClick={handleForceClose}>
              Skip Setup
            </Button>
            <Button variant="outline" onClick={handleManualSetupComplete}>
              I've Run the SQL Manually
            </Button>
            <Button onClick={executeSQL} disabled={loading}>
              {loading ? "Creating tables..." : "Create Tables Automatically"}
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  )
}

// Add default export for backward compatibility
export default DatabaseSetupPopup
