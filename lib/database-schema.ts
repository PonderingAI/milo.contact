/**
 * Database Schema Configuration
 *
 * This file defines all database tables used in the application.
 * It serves as a central registry for database schema information.
 */

export interface TableDefinition {
  name: string
  displayName: string
  description: string
  category: "core" | "content" | "media" | "security" | "dependencies" | "other"
  required: boolean
  dependencies: string[]
  sqlFile: string // Path to the SQL file that creates this table
}

/**
 * All database tables used in the application
 */
export const DATABASE_TABLES: TableDefinition[] = [
  // Core tables
  {
    name: "user_roles",
    displayName: "User Roles",
    description: "Stores user roles and permissions",
    category: "core",
    required: true,
    dependencies: [],
    sqlFile: "docs/setup/core-tables.sql",
  },
  {
    name: "site_settings",
    displayName: "Site Settings",
    description: "Stores site-wide settings and configuration",
    category: "core",
    required: true,
    dependencies: ["user_roles"],
    sqlFile: "docs/setup/core-tables.sql",
  },

  // Content tables
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
    name: "bts_images",
    displayName: "Behind-the-Scenes Images",
    description: "Stores behind-the-scenes images for projects",
    category: "content",
    required: false,
    dependencies: ["projects", "user_roles"],
    sqlFile: "docs/setup/content-tables.sql",
  },
  {
    name: "contact_messages",
    displayName: "Contact Messages",
    description: "Stores contact form submissions",
    category: "content",
    required: false,
    dependencies: ["user_roles"],
    sqlFile: "docs/setup/content-tables.sql",
  },

  // Media tables
  {
    name: "media",
    displayName: "Media Library",
    description: "Stores uploaded media files metadata",
    category: "media",
    required: false,
    dependencies: ["user_roles"],
    sqlFile: "docs/setup/media-tables.sql",
  },

  // Security and dependency tables
  {
    name: "dependencies",
    displayName: "Dependencies",
    description: "Stores information about project dependencies",
    category: "dependencies",
    required: false,
    dependencies: ["user_roles"],
    sqlFile: "docs/setup/dependency-tables.sql",
  },
  {
    name: "dependency_settings",
    displayName: "Dependency Settings",
    description: "Stores settings for dependency management",
    category: "dependencies",
    required: false,
    dependencies: ["user_roles"],
    sqlFile: "docs/setup/dependency-tables.sql",
  },
  {
    name: "dependency_compatibility",
    displayName: "Dependency Compatibility",
    description: "Stores compatibility information for dependencies",
    category: "dependencies",
    required: false,
    dependencies: ["user_roles", "dependencies"],
    sqlFile: "docs/setup/dependency-tables.sql",
  },
  {
    name: "security_audits",
    displayName: "Security Audits",
    description: "Stores security audit results",
    category: "security",
    required: false,
    dependencies: ["user_roles"],
    sqlFile: "docs/setup/dependency-tables.sql",
  },
  {
    name: "dependabot_alerts",
    displayName: "Dependabot Alerts",
    description: "Stores GitHub Dependabot security alerts",
    category: "dependencies",
    required: false,
    dependencies: ["user_roles", "dependencies"],
    sqlFile: "docs/setup/dependency-tables.sql",
  },
  {
    name: "dependency_update_history", 
    displayName: "Dependency Update History",
    description: "Tracks all dependency update attempts and results",
    category: "dependencies",
    required: false,
    dependencies: ["user_roles", "dependencies", "dependabot_alerts"],
    sqlFile: "docs/setup/dependency-tables.sql",
  },

  // Other tables
  {
    name: "widget_types",
    displayName: "Widget Types",
    description: "Stores available widget types for the page builder",
    category: "other",
    required: false,
    dependencies: ["user_roles"],
    sqlFile: "docs/setup/widget-tables.sql",
  },
  {
    name: "user_widgets",
    displayName: "User Widgets",
    description: "Stores user-created widget instances",
    category: "other",
    required: false,
    dependencies: ["widget_types", "user_roles"],
    sqlFile: "docs/setup/widget-tables.sql",
  },
]

/**
 * Get tables by category
 */
export function getTablesByCategory(category: string): TableDefinition[] {
  return DATABASE_TABLES.filter((table) => table.category === category)
}

/**
 * Get table by name
 */
export function getTableByName(name: string): TableDefinition | undefined {
  return DATABASE_TABLES.find((table) => table.name === name)
}

/**
 * Get all required tables
 */
export function getRequiredTables(): TableDefinition[] {
  return DATABASE_TABLES.filter((table) => table.required)
}

/**
 * Get tables required for a specific section
 */
export function getTablesForSection(section: string): TableDefinition[] {
  switch (section) {
    case "admin":
      return DATABASE_TABLES.filter((table) => table.category === "core" || table.required)
    case "projects":
      return DATABASE_TABLES.filter(
        (table) => table.category === "content" || table.name === "projects" || table.name === "bts_images",
      )
    case "media":
      return DATABASE_TABLES.filter((table) => table.category === "media")
    case "security":
      return DATABASE_TABLES.filter((table) => table.category === "security" || table.category === "dependencies")
    default:
      return getRequiredTables()
  }
}

/**
 * Get all SQL files needed to create the specified tables
 */
export function getSqlFilesForTables(tableNames: string[]): string[] {
  const sqlFiles = new Set<string>()

  tableNames.forEach((tableName) => {
    const table = getTableByName(tableName)
    if (table) {
      sqlFiles.add(table.sqlFile)
    }
  })

  return Array.from(sqlFiles)
}
