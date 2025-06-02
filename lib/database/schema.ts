/**
 * Centralized Database Schema Configuration
 * 
 * This file contains all database table definitions and their metadata.
 * It serves as the single source of truth for the database schema.
 */

export interface TableColumn {
  name: string
  type: string
  constraints?: string[]
  default?: string
}

export interface TableConfig {
  name: string
  displayName: string
  description: string
  sql: string
  dependencies: string[]
  required: boolean
  category: "core" | "content" | "media" | "security" | "dependencies" | "other"
  version: number
  columns?: TableColumn[]
  indexes?: string[]
  policies?: string[]
}

export interface SchemaVersion {
  version: number
  tables: Record<string, TableConfig>
  migrations?: string[]
}

// Current schema version
export const CURRENT_SCHEMA_VERSION = 1

// All table configurations
export const tableConfigs: Record<string, TableConfig> = {
  user_roles: {
    name: "user_roles",
    displayName: "User Roles",
    description: "Stores user roles and permissions",
    sql: `
CREATE TABLE IF NOT EXISTS user_roles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id TEXT NOT NULL,
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
    )
    WITH CHECK (
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
    version: 1,
    columns: [
      { name: "id", type: "UUID", constraints: ["PRIMARY KEY"], default: "uuid_generate_v4()" },
      { name: "user_id", type: "TEXT", constraints: ["NOT NULL"] },
      { name: "role", type: "TEXT", constraints: ["NOT NULL"] },
      { name: "created_at", type: "TIMESTAMP WITH TIME ZONE", default: "NOW()" }
    ],
    indexes: ["UNIQUE(user_id, role)"],
    policies: ["users_read_own_roles", "admins_manage_roles"]
  },

  site_settings: {
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
    )
    WITH CHECK (
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
    version: 1,
    columns: [
      { name: "id", type: "SERIAL", constraints: ["PRIMARY KEY"] },
      { name: "key", type: "TEXT", constraints: ["UNIQUE", "NOT NULL"] },
      { name: "value", type: "TEXT" },
      { name: "created_at", type: "TIMESTAMP WITH TIME ZONE", default: "NOW()" },
      { name: "updated_at", type: "TIMESTAMP WITH TIME ZONE", default: "NOW()" }
    ],
    policies: ["public_read_settings", "admins_manage_settings"]
  },

  projects: {
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
    )
    WITH CHECK (
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
    required: true,
    category: "content",
    version: 1,
    columns: [
      { name: "id", type: "UUID", constraints: ["PRIMARY KEY"], default: "uuid_generate_v4()" },
      { name: "title", type: "TEXT", constraints: ["NOT NULL"] },
      { name: "description", type: "TEXT" },
      { name: "content", type: "TEXT" },
      { name: "image", type: "TEXT" },
      { name: "thumbnail_url", type: "TEXT" },
      { name: "category", type: "TEXT" },
      { name: "type", type: "TEXT" },
      { name: "role", type: "TEXT" },
      { name: "date", type: "DATE" },
      { name: "project_date", type: "DATE" },
      { name: "client", type: "TEXT" },
      { name: "url", type: "TEXT" },
      { name: "featured", type: "BOOLEAN", default: "false" },
      { name: "is_public", type: "BOOLEAN", default: "true" },
      { name: "publish_date", type: "TIMESTAMP WITH TIME ZONE" },
      { name: "created_at", type: "TIMESTAMP WITH TIME ZONE", default: "NOW()" },
      { name: "updated_at", type: "TIMESTAMP WITH TIME ZONE", default: "NOW()" }
    ],
    indexes: ["idx_projects_is_public", "idx_projects_publish_date"],
    policies: ["public_read_projects", "admins_manage_projects"]
  }
}

/**
 * Get all tables as an array
 */
export function getAllTables(): TableConfig[] {
  return Object.values(tableConfigs)
}

/**
 * Get tables by category
 */
export function getTablesByCategory(category: TableConfig["category"]): TableConfig[] {
  return getAllTables().filter(table => table.category === category)
}

/**
 * Get required tables
 */
export function getRequiredTables(): TableConfig[] {
  return getAllTables().filter(table => table.required)
}

/**
 * Get table by name
 */
export function getTableConfig(name: string): TableConfig | undefined {
  return tableConfigs[name]
}

/**
 * Get tables that depend on a specific table
 */
export function getTableDependents(tableName: string): TableConfig[] {
  return getAllTables().filter(table => table.dependencies.includes(tableName))
}

/**
 * Get all dependencies for a table (recursive)
 */
export function getTableDependencies(tableName: string): string[] {
  const table = getTableConfig(tableName)
  if (!table) return []
  
  const dependencies = new Set<string>()
  
  function addDependencies(name: string) {
    const config = getTableConfig(name)
    if (!config) return
    
    for (const dep of config.dependencies) {
      if (!dependencies.has(dep)) {
        dependencies.add(dep)
        addDependencies(dep)
      }
    }
  }
  
  addDependencies(tableName)
  return Array.from(dependencies)
}

/**
 * Validate table configuration
 */
export function validateTableConfig(config: TableConfig): string[] {
  const errors: string[] = []
  
  if (!config.name) errors.push("Table name is required")
  if (!config.displayName) errors.push("Display name is required")
  if (!config.sql) errors.push("SQL is required")
  if (!config.category) errors.push("Category is required")
  if (typeof config.version !== "number") errors.push("Version must be a number")
  
  // Check dependencies exist
  for (const dep of config.dependencies) {
    if (!getTableConfig(dep)) {
      errors.push(`Dependency '${dep}' does not exist`)
    }
  }
  
  return errors
}

/**
 * Get schema summary
 */
export function getSchemaSummary() {
  const tables = getAllTables()
  const categories = Array.from(new Set(tables.map(t => t.category)))
  
  return {
    version: CURRENT_SCHEMA_VERSION,
    totalTables: tables.length,
    requiredTables: getRequiredTables().length,
    categories: categories.map(cat => ({
      name: cat,
      count: getTablesByCategory(cat).length
    })),
    tables: tables.map(t => ({
      name: t.name,
      displayName: t.displayName,
      category: t.category,
      required: t.required,
      dependencies: t.dependencies.length
    }))
  }
}