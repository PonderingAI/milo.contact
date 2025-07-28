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

-- Insert default settings
INSERT INTO site_settings (key, value)
VALUES 
  ('site_title', 'My Portfolio'),
  ('site_description', 'My professional portfolio website'),
  ('hero_heading', 'Welcome to my portfolio'),
  ('hero_subheading', 'Check out my latest projects')
ON CONFLICT (key) DO NOTHING;`,
    dependencies: [],
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
    dependencies: [],
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
  },

  media: {
    name: "media",
    displayName: "Media Files",
    description: "Stores media files and assets",
    sql: `
CREATE TABLE IF NOT EXISTS media (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  filename TEXT NOT NULL,
  original_filename TEXT,
  filepath TEXT,
  public_url TEXT,
  filesize INTEGER,
  filetype TEXT,
  thumbnail_url TEXT,
  tags TEXT[],
  metadata JSONB,
  uploaded_by TEXT,
  project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_media_project_id ON media(project_id);
CREATE INDEX IF NOT EXISTS idx_media_filetype ON media(filetype);
CREATE INDEX IF NOT EXISTS idx_media_uploaded_by ON media(uploaded_by);
CREATE INDEX IF NOT EXISTS idx_media_public_url ON media(public_url);
CREATE INDEX IF NOT EXISTS idx_media_tags ON media USING GIN(tags);

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
    dependencies: [ "projects"],
    required: false,
    category: "media",
    version: 1,
    columns: [
      { name: "id", type: "UUID", constraints: ["PRIMARY KEY"], default: "uuid_generate_v4()" },
      { name: "filename", type: "TEXT", constraints: ["NOT NULL"] },
      { name: "original_filename", type: "TEXT" },
      { name: "filepath", type: "TEXT" },
      { name: "public_url", type: "TEXT" },
      { name: "filesize", type: "INTEGER" },
      { name: "filetype", type: "TEXT" },
      { name: "thumbnail_url", type: "TEXT" },
      { name: "tags", type: "TEXT[]" },
      { name: "metadata", type: "JSONB" },
      { name: "uploaded_by", type: "TEXT" },
      { name: "project_id", type: "UUID" },
      { name: "created_at", type: "TIMESTAMP WITH TIME ZONE", default: "NOW()" },
      { name: "updated_at", type: "TIMESTAMP WITH TIME ZONE", default: "NOW()" }
    ],
    indexes: ["idx_media_project_id", "idx_media_filetype", "idx_media_uploaded_by", "idx_media_public_url", "idx_media_tags"],
    policies: ["public_read_media", "admins_manage_media"]
  },

  main_media: {
    name: "main_media",
    displayName: "Main Media",
    description: "Stores main images and videos for projects (multiple main media support)",
    sql: `
CREATE TABLE IF NOT EXISTS main_media (
  id SERIAL PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  caption TEXT,
  is_video BOOLEAN DEFAULT FALSE,
  video_url TEXT,
  video_platform TEXT,
  video_id TEXT,
  display_order INTEGER DEFAULT 0,
  is_thumbnail_hidden BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_main_media_project_id ON main_media(project_id);
CREATE INDEX IF NOT EXISTS idx_main_media_display_order ON main_media(project_id, display_order);
CREATE INDEX IF NOT EXISTS idx_main_media_visibility ON main_media(project_id, is_thumbnail_hidden);

-- Set up Row Level Security (RLS) policies
ALTER TABLE main_media ENABLE ROW LEVEL SECURITY;

-- Allow public read access
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'main_media' AND policyname = 'public_read_main_media'
  ) THEN
    CREATE POLICY "public_read_main_media"
    ON main_media
    FOR SELECT
    TO public
    USING (true);
  END IF;
EXCEPTION WHEN OTHERS THEN
  -- Policy already exists or other error
END $$;

-- Allow authenticated users with admin role to manage main media
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'main_media' AND policyname = 'admins_manage_main_media'
  ) THEN
    CREATE POLICY "admins_manage_main_media"
    ON main_media
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
    dependencies: ["projects"],
    required: false,
    category: "media",
    version: 1,
    columns: [
      { name: "id", type: "SERIAL", constraints: ["PRIMARY KEY"] },
      { name: "project_id", type: "UUID", constraints: ["NOT NULL", "REFERENCES projects(id) ON DELETE CASCADE"] },
      { name: "image_url", type: "TEXT", constraints: ["NOT NULL"] },
      { name: "caption", type: "TEXT" },
      { name: "is_video", type: "BOOLEAN", default: "FALSE" },
      { name: "video_url", type: "TEXT" },
      { name: "video_platform", type: "TEXT" },
      { name: "video_id", type: "TEXT" },
      { name: "display_order", type: "INTEGER", default: "0" },
      { name: "is_thumbnail_hidden", type: "BOOLEAN", default: "FALSE" },
      { name: "created_at", type: "TIMESTAMP WITH TIME ZONE", default: "NOW()" },
      { name: "updated_at", type: "TIMESTAMP WITH TIME ZONE", default: "NOW()" }
    ],
    indexes: ["idx_main_media_project_id", "idx_main_media_display_order", "idx_main_media_visibility"],
    policies: ["public_read_main_media", "admins_manage_main_media"]
  },

  bts_images: {
    name: "bts_images",
    displayName: "Behind the Scenes Images",
    description: "Stores behind-the-scenes images and videos for projects",
    sql: `
CREATE TABLE IF NOT EXISTS bts_images (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  caption TEXT,
  size TEXT,
  aspect_ratio TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  category TEXT DEFAULT 'general'
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_bts_images_project_id ON bts_images(project_id);

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

-- Allow authenticated users with admin role to manage BTS images
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
    dependencies: [ "projects"],
    required: false,
    category: "content",
    version: 1,
    columns: [
      { name: "id", type: "UUID", constraints: ["PRIMARY KEY"], default: "uuid_generate_v4()" },
      { name: "project_id", type: "UUID" },
      { name: "image_url", type: "TEXT", constraints: ["NOT NULL"] },
      { name: "caption", type: "TEXT" },
      { name: "size", type: "TEXT" },
      { name: "aspect_ratio", type: "TEXT" },
      { name: "created_at", type: "TIMESTAMP WITH TIME ZONE", default: "NOW()" },
      { name: "category", type: "TEXT", default: "'general'" }
    ],
    indexes: ["idx_bts_images_project_id"],
    policies: ["public_read_bts_images", "admins_manage_bts_images"]
  },

  dependencies: {
    name: "dependencies",
    displayName: "Dependencies",
    description: "Stores information about project dependencies",
    sql: `
CREATE TABLE IF NOT EXISTS dependencies (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  package_name TEXT NOT NULL,
  version TEXT NOT NULL,
  dev_dependency BOOLEAN DEFAULT false,
  description TEXT,
  homepage TEXT,
  repository TEXT,
  license TEXT,
  last_checked TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_dependencies_project_id ON dependencies(project_id);
CREATE INDEX IF NOT EXISTS idx_dependencies_package_name ON dependencies(package_name);
CREATE INDEX IF NOT EXISTS idx_dependencies_dev_dependency ON dependencies(dev_dependency);

-- Add RLS policies
ALTER TABLE dependencies ENABLE ROW LEVEL SECURITY;

-- Allow public read access
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'dependencies' AND policyname = 'public_read_dependencies'
  ) THEN
    CREATE POLICY "public_read_dependencies"
    ON dependencies
    FOR SELECT
    TO public
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
    dependencies: [ "projects"],
    required: false,
    category: "dependencies",
    version: 1,
    columns: [
      { name: "id", type: "UUID", constraints: ["PRIMARY KEY"], default: "uuid_generate_v4()" },
      { name: "project_id", type: "UUID" },
      { name: "package_name", type: "TEXT", constraints: ["NOT NULL"] },
      { name: "version", type: "TEXT", constraints: ["NOT NULL"] },
      { name: "dev_dependency", type: "BOOLEAN", default: "false" },
      { name: "description", type: "TEXT" },
      { name: "homepage", type: "TEXT" },
      { name: "repository", type: "TEXT" },
      { name: "license", type: "TEXT" },
      { name: "last_checked", type: "TIMESTAMP WITH TIME ZONE", default: "NOW()" },
      { name: "created_at", type: "TIMESTAMP WITH TIME ZONE", default: "NOW()" },
      { name: "updated_at", type: "TIMESTAMP WITH TIME ZONE", default: "NOW()" }
    ],
    indexes: ["idx_dependencies_project_id", "idx_dependencies_package_name", "idx_dependencies_dev_dependency"],
    policies: ["public_read_dependencies", "admins_manage_dependencies"]
  },

  security_audits: {
    name: "security_audits",
    displayName: "Security Audits",
    description: "Stores security audit logs and findings",
    sql: `
CREATE TABLE IF NOT EXISTS security_audits (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  audit_type TEXT NOT NULL,
  severity TEXT NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  title TEXT NOT NULL,
  description TEXT,
  affected_table TEXT,
  affected_column TEXT,
  remediation TEXT,
  status TEXT DEFAULT 'open' CHECK (status IN ('open', 'investigating', 'resolved', 'false_positive')),
  audited_by TEXT,
  resolved_by TEXT,
  resolved_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_security_audits_audit_type ON security_audits(audit_type);
CREATE INDEX IF NOT EXISTS idx_security_audits_severity ON security_audits(severity);
CREATE INDEX IF NOT EXISTS idx_security_audits_status ON security_audits(status);
CREATE INDEX IF NOT EXISTS idx_security_audits_created_at ON security_audits(created_at);

-- Add RLS policies
ALTER TABLE security_audits ENABLE ROW LEVEL SECURITY;

-- Allow public read access to non-sensitive audit information
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'security_audits' AND policyname = 'public_read_audits'
  ) THEN
    CREATE POLICY "public_read_audits"
    ON security_audits
    FOR SELECT
    TO public
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
    required: false,
    category: "security",
    version: 1,
    columns: [
      { name: "id", type: "UUID", constraints: ["PRIMARY KEY"], default: "uuid_generate_v4()" },
      { name: "audit_type", type: "TEXT", constraints: ["NOT NULL"] },
      { name: "severity", type: "TEXT", constraints: ["NOT NULL", "CHECK (severity IN ('low', 'medium', 'high', 'critical'))"] },
      { name: "title", type: "TEXT", constraints: ["NOT NULL"] },
      { name: "description", type: "TEXT" },
      { name: "affected_table", type: "TEXT" },
      { name: "affected_column", type: "TEXT" },
      { name: "remediation", type: "TEXT" },
      { name: "status", type: "TEXT", default: "'open'", constraints: ["CHECK (status IN ('open', 'investigating', 'resolved', 'false_positive'))"] },
      { name: "audited_by", type: "TEXT" },
      { name: "resolved_by", type: "TEXT" },
      { name: "resolved_at", type: "TIMESTAMP WITH TIME ZONE" },
      { name: "created_at", type: "TIMESTAMP WITH TIME ZONE", default: "NOW()" },
      { name: "updated_at", type: "TIMESTAMP WITH TIME ZONE", default: "NOW()" }
    ],
    indexes: ["idx_security_audits_audit_type", "idx_security_audits_severity", "idx_security_audits_status", "idx_security_audits_created_at"],
    policies: ["public_read_audits", "admins_manage_audits"]
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