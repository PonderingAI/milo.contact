"use client"

import { useEffect } from "react"
import { useState, useCallback } from "react"
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
import { AlertCircle, Copy, Check, Database, RefreshCw, X } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"

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
  ...props
}: DatabaseSetupPopupProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [checking, setChecking] = useState(true)
  const [copied, setCopied] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [missingTables, setMissingTables] = useState<string[]>([])
  const [selectedTables, setSelectedTables] = useState<string[]>([])
  const [activeTab, setActiveTab] = useState<string>("all")
  const [setupCompleted, setSetupCompleted] = useState(false)
  const [forceClose, setForceClose] = useState(false)
  const [isAdminPage, setIsAdminPage] = useState(false)

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
  client TEXT,
  url TEXT,
  featured BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add RLS policies
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

-- Allow public read access
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'projects' AND policyname = 'public_read_projects'
  ) THEN
    CREATE POLICY "public_read_projects"
    ON projects
    FOR SELECT
    TO public
    USING (true);
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
  update_mode VARCHAR(50) DEFAULT 'conservative',
  auto_update_enabled BOOLEAN DEFAULT FALSE,
  update_schedule VARCHAR(100) DEFAULT 'daily',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default settings
INSERT INTO dependency_settings (update_mode, auto_update_enabled, update_schedule)
VALUES ('conservative', FALSE, 'daily')
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

  // Function to check if tables exist - using a more reliable method
  const checkTables = useCallback(async () => {
    if (forceClose || setupCompleted || (adminOnly && !isAdminPage)) {
      return
    }

    setChecking(true)
    setError(null)

    try {
      // First, try to directly query the information_schema to check tables
      // This is more reliable than the API route
      const response = await fetch("/api/direct-table-check", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          tables:
            customTables.length > 0
              ? customTables
              : allTables
                  .filter((table) => requiredSections.includes("all") || requiredSections.includes(table.category))
                  .map((table) => table.name),
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to check tables")
      }

      const data = await response.json()

      if (data.error) {
        console.error("Error checking tables:", data.error)
        throw new Error(data.error)
      }

      // data.missingTables contains the list of tables that don't exist
      const missingTablesList = data.missingTables || []

      setMissingTables(missingTablesList)
      setSelectedTables(missingTablesList)

      // Only open the popup if there are missing tables and we're on an admin page
      if (missingTablesList.length > 0 && isAdminPage) {
        setOpen(true)
      } else {
        setOpen(false)
        setSetupCompleted(true)
        if (onSetupComplete) {
          onSetupComplete()
        }
      }
    } catch (error) {
      console.error("Error checking tables:", error)
      setError("Failed to check database tables. Please try again or use the Skip Setup button.")

      // If we can't check tables, don't show the popup on non-admin pages
      if (!isAdminPage && adminOnly) {
        setForceClose(true)
      }
    } finally {
      setChecking(false)
    }
  }, [requiredSections, customTables, forceClose, setupCompleted, onSetupComplete, adminOnly, isAdminPage, allTables])

  // Function to generate SQL for selected tables
  // Make the generateSQL function public and static so it can be called without an instance
  const generateSQLForTables = (tableNames: string[], allTables: TableConfig[]): string => {
    // Start with UUID extension
    let sql = `-- Enable UUID extension if not already enabled
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
          if (tableNames.includes(dep)) {
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
    for (const tableName of tableNames) {
      processTable(tableName)
    }

    return sql.trim()
  }

  // Modify the existing generateSQL method to use the static method
  const generateSQL = () => {
    return generateSQLForTables(selectedTables, allTables)
  }

  // Function to copy SQL to clipboard
  const copyToClipboard = () => {
    const sql = generateSQL()
    navigator.clipboard.writeText(sql)
    setCopied(true)
    setTimeout(() => setCopied(false), 3000)
  }

  // Function to execute SQL
  const executeSQL = async () => {
    setLoading(true)
    setError(null)
    setSuccess(null)

    try {
      const sql = generateSQL()
      const response = await fetch("/api/execute-sql", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ sql }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to execute SQL")
      }

      setSuccess("Database tables created successfully!")

      // Wait a moment before closing to show success message
      setTimeout(() => {
        setOpen(false)
        setSetupCompleted(true)

        // Save to localStorage to prevent popup from showing again
        try {
          localStorage.setItem("database_setup_completed", "true")
        } catch (e) {
          console.error("Could not save to localStorage", e)
        }

        if (onSetupComplete) {
          onSetupComplete()
        }
      }, 1500)
    } catch (error) {
      console.error("Error executing SQL:", error)
      setError(error instanceof Error ? error.message : "An unexpected error occurred")
    } finally {
      setLoading(false)
    }
  }

  // Function to handle table selection
  const handleTableSelection = (tableName: string, checked: boolean) => {
    if (checked) {
      setSelectedTables((prev) => [...prev, tableName])
    } else {
      setSelectedTables((prev) => prev.filter((t) => t !== tableName))
    }
  }

  // Filter tables by category
  const getFilteredTables = () => {
    if (activeTab === "all") {
      return allTables.filter((table) => missingTables.includes(table.name))
    }

    return allTables.filter((table) => missingTables.includes(table.name) && table.category === activeTab)
  }

  // Get categories that have missing tables
  const getCategories = () => {
    const categories = new Set<string>()

    for (const table of allTables) {
      if (missingTables.includes(table.name)) {
        categories.add(table.category)
      }
    }

    return Array.from(categories)
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
      setOpen(false)
      setSetupCompleted(true)

      if (onSetupComplete) {
        onSetupComplete()
      }

      // Refresh the page to ensure everything is loaded correctly
      window.location.reload()
    }, 1500)
  }

  // Check for missing tables on component mount
  useEffect(() => {
    // Check if setup was previously completed
    try {
      const completed = localStorage.getItem("database_setup_completed")
      if (completed === "true") {
        setForceClose(true)
        setSetupCompleted(true)
        return
      }
    } catch (e) {
      console.error("Could not read from localStorage", e)
    }

    // Only run the check if we're on an admin page and adminOnly is true
    if (!adminOnly || (adminOnly && isAdminPage)) {
      checkTables()
    }
  }, [checkTables, adminOnly, isAdminPage])

  // If force closed, setup completed, or not on admin page when adminOnly is true, don't render
  if (forceClose || (setupCompleted && !open) || (adminOnly && !isAdminPage)) {
    return null
  }

  // If stationary, render the content directly without the Dialog wrapper
  if (props.isStationary) {
    return (
      <div className="w-full">
        <div className="flex items-center justify-between gap-2 mb-4">
          <div className="flex items-center">
            <Database className="h-5 w-5 mr-2" />
            <h2 className="text-xl font-semibold">{title}</h2>
          </div>
          <Button variant="ghost" size="icon" onClick={handleForceClose} title="Skip setup (not recommended)">
            <X className="h-4 w-4" />
          </Button>
        </div>
        <p className="text-sm text-gray-500 mb-6">{description}</p>

        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {success && (
          <Alert variant="default" className="mb-4 bg-green-50 text-green-800 border-green-200">
            <Check className="h-4 w-4" />
            <AlertDescription>{success}</AlertDescription>
          </Alert>
        )}

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium">Database Tables</h3>
            <Button variant="outline" size="sm" onClick={checkTables} disabled={checking}>
              <RefreshCw className={`h-4 w-4 mr-2 ${checking ? "animate-spin" : ""}`} />
              Refresh
            </Button>
          </div>

          <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab}>
            <TabsList>
              <TabsTrigger value="all">All Tables</TabsTrigger>
              {getCategories().map((category) => (
                <TabsTrigger key={category} value={category}>
                  {category.charAt(0).toUpperCase() + category.slice(1)}
                </TabsTrigger>
              ))}
            </TabsList>

            <TabsContent value="all" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                {getFilteredTables().map((table) => (
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
                      <p className="text-sm text-gray-500">{table.description}</p>
                      {table.dependencies.length > 0 && (
                        <p className="text-xs text-gray-400">Depends on: {table.dependencies.join(", ")}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </TabsContent>

            {getCategories().map((category) => (
              <TabsContent key={category} value={category} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                  {getFilteredTables().map((table) => (
                    <div key={table.name} className="flex items-start space-x-2 border p-3 rounded-md">
                      <Checkbox
                        id={`table-${table.name}-${category}`}
                        checked={selectedTables.includes(table.name)}
                        onCheckedChange={(checked) => handleTableSelection(table.name, checked === true)}
                        disabled={table.required}
                      />
                      <div className="space-y-1">
                        <Label htmlFor={`table-${table.name}-${category}`} className="font-medium cursor-pointer">
                          {table.displayName}
                          {table.required && <span className="text-red-500 ml-2">(Required)</span>}
                        </Label>
                        <p className="text-sm text-gray-500">{table.description}</p>
                        {table.dependencies.length > 0 && (
                          <p className="text-xs text-gray-400">Depends on: {table.dependencies.join(", ")}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </TabsContent>
            ))}
          </Tabs>

          <div className="mt-6">
            <h3 className="text-lg font-medium mb-2">Generated SQL</h3>
            <Textarea value={generateSQL()} readOnly className="h-64 font-mono text-sm bg-gray-50 dark:bg-gray-900" />
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

          <div className="flex flex-col sm:flex-row gap-3 justify-end">
            <Button variant="outline" onClick={copyToClipboard}>
              {copied ? <Check className="mr-2 h-4 w-4" /> : <Copy className="mr-2 h-4 w-4" />}
              {copied ? "Copied!" : "Copy SQL"}
            </Button>
            <Button variant="outline" onClick={handleForceClose}>
              Skip Setup
            </Button>
            <Button variant="outline" onClick={handleManualSetupComplete}>
              I've Run the SQL Manually
            </Button>
            <Button onClick={executeSQL} disabled={loading}>
              {loading ? "Creating tables..." : "Create Tables Automatically"}
            </Button>
          </div>
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
          <Alert variant="default" className="mb-4 bg-green-50 text-green-800 border-green-200">
            <Check className="h-4 w-4" />
            <AlertDescription>{success}</AlertDescription>
          </Alert>
        )}

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium">Missing Tables</h3>
            <Button variant="outline" size="sm" onClick={checkTables} disabled={checking}>
              <RefreshCw className={`h-4 w-4 mr-2 ${checking ? "animate-spin" : ""}`} />
              Refresh
            </Button>
          </div>

          <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab}>
            <TabsList>
              <TabsTrigger value="all">All Tables</TabsTrigger>
              {getCategories().map((category) => (
                <TabsTrigger key={category} value={category}>
                  {category.charAt(0).toUpperCase() + category.slice(1)}
                </TabsTrigger>
              ))}
            </TabsList>

            <TabsContent value="all" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                {getFilteredTables().map((table) => (
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
                      <p className="text-sm text-gray-500">{table.description}</p>
                      {table.dependencies.length > 0 && (
                        <p className="text-xs text-gray-400">Depends on: {table.dependencies.join(", ")}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </TabsContent>

            {getCategories().map((category) => (
              <TabsContent key={category} value={category} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                  {getFilteredTables().map((table) => (
                    <div key={table.name} className="flex items-start space-x-2 border p-3 rounded-md">
                      <Checkbox
                        id={`table-${table.name}-${category}`}
                        checked={selectedTables.includes(table.name)}
                        onCheckedChange={(checked) => handleTableSelection(table.name, checked === true)}
                        disabled={table.required}
                      />
                      <div className="space-y-1">
                        <Label htmlFor={`table-${table.name}-${category}`} className="font-medium cursor-pointer">
                          {table.displayName}
                          {table.required && <span className="text-red-500 ml-2">(Required)</span>}
                        </Label>
                        <p className="text-sm text-gray-500">{table.description}</p>
                        {table.dependencies.length > 0 && (
                          <p className="text-xs text-gray-400">Depends on: {table.dependencies.join(", ")}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </TabsContent>
            ))}
          </Tabs>

          <div className="mt-6">
            <h3 className="text-lg font-medium mb-2">Generated SQL</h3>
            <Textarea value={generateSQL()} readOnly className="h-64 font-mono text-sm bg-gray-50 dark:bg-gray-900" />
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
            <Button variant="outline" onClick={copyToClipboard}>
              {copied ? <Check className="mr-2 h-4 w-4" /> : <Copy className="mr-2 h-4 w-4" />}
              {copied ? "Copied!" : "Copy SQL"}
            </Button>
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
