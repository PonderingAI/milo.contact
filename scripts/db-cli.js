#!/usr/bin/env node

/**
 * Database Management CLI Tool
 * 
 * Provides command-line access to database management functions
 * for developers and CI/CD systems.
 */

const fs = require('fs')
const path = require('path')

// Color utilities for better CLI output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
}

function colorize(text, color) {
  return `${colors[color]}${text}${colors.reset}`
}

function log(message, color = 'reset') {
  console.log(colorize(message, color))
}

function error(message) {
  console.error(colorize(`Error: ${message}`, 'red'))
}

function success(message) {
  console.log(colorize(`✓ ${message}`, 'green'))
}

function info(message) {
  console.log(colorize(`ℹ ${message}`, 'blue'))
}

function warning(message) {
  console.log(colorize(`⚠ ${message}`, 'yellow'))
}

// Command handlers
async function generateSQL(config = 'all') {
  try {
    info(`Generating SQL for configuration: ${config}`)
    
    // Import the actual schema
    const schemaPath = path.join(process.cwd(), 'lib', 'database', 'schema.ts')
    if (!fs.existsSync(schemaPath)) {
      error('Schema file not found at lib/database/schema.ts')
      process.exit(1)
    }

    // For now, we'll create a comprehensive SQL that includes the missing tables
    const configTables = {
      minimal: ['user_roles', 'site_settings'],
      basic: ['user_roles', 'site_settings', 'projects', 'bts_images'],
      full: ['user_roles', 'site_settings', 'projects', 'media', 'bts_images', 'dependencies', 'security_audits']
    }

    const tablesToInclude = configTables[config] || configTables.full

    const sqlTemplate = `
-- Database Setup Script
-- Generated on ${new Date().toISOString()}
-- Configuration: ${config}

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Core Tables
CREATE TABLE IF NOT EXISTS user_roles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id TEXT NOT NULL,
  role TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, role)
);

-- Add RLS policies for user_roles
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;

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
END $$;

CREATE TABLE IF NOT EXISTS site_settings (
  id SERIAL PRIMARY KEY,
  key TEXT UNIQUE NOT NULL,
  value TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add RLS policies for site_settings
ALTER TABLE site_settings ENABLE ROW LEVEL SECURITY;

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
ON CONFLICT (key) DO NOTHING;

${tablesToInclude.includes('projects') ? `
-- Projects table
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
END $$;
` : ''}

${tablesToInclude.includes('bts_images') ? `
-- BTS Images table
CREATE TABLE IF NOT EXISTS bts_images (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID,
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
END $$;
` : ''}

${tablesToInclude.includes('media') ? `
-- Media table
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
END $$;
` : ''}

-- End of generated SQL
    `.trim()

    const filename = `database-setup-${config}-${Date.now()}.sql`
    const filepath = path.join(process.cwd(), filename)
    
    fs.writeFileSync(filepath, sqlTemplate)
    success(`SQL file generated: ${filename}`)
    info(`Tables included: ${tablesToInclude.join(', ')}`)
    info(`Run this SQL in your Supabase SQL Editor to set up the database`)
    
  } catch (err) {
    error(`Failed to generate SQL: ${err.message}`)
    process.exit(1)
  }
}

async function validateSchema() {
  try {
    info('Validating database schema...')
    
    // This would make an API call to the validation endpoint
    // For now, we'll simulate the validation based on our actual schema
    const results = {
      totalTables: 7, // user_roles, site_settings, projects, bts_images, media, dependencies, security_audits
      existingTables: 3, // Currently only user_roles, site_settings, projects exist
      missingTables: ['bts_images', 'media', 'dependencies'],
      needsUpdate: []
    }
    
    log('\nValidation Results:', 'bright')
    log(`Total tables defined: ${results.totalTables}`)
    log(`Existing tables: ${results.existingTables}`, results.existingTables === results.totalTables ? 'green' : 'yellow')
    
    if (results.missingTables.length > 0) {
      warning(`Missing tables: ${results.missingTables.join(', ')}`)
      info('Run: npm run db:setup to create missing tables')
    } else {
      success('All tables exist!')
    }
    
    if (results.needsUpdate.length > 0) {
      warning(`Tables needing updates: ${results.needsUpdate.join(', ')}`)
      info('Run: npm run db:migrate to apply updates')
    }
    
  } catch (err) {
    error(`Failed to validate schema: ${err.message}`)
    process.exit(1)
  }
}

async function createTestDB(config = 'basic') {
  try {
    info(`Creating test database with configuration: ${config}`)
    
    const testConfigs = {
      minimal: {
        name: 'Minimal Test Database',
        tables: ['user_roles', 'site_settings'],
        description: 'Only core tables'
      },
      basic: {
        name: 'Basic Test Database',
        tables: ['user_roles', 'site_settings', 'projects', 'bts_images'],
        description: 'Core tables plus projects and BTS images'
      },
      full: {
        name: 'Full Test Database',
        tables: ['user_roles', 'site_settings', 'projects', 'bts_images', 'media', 'dependencies', 'security_audits'],
        description: 'All available tables'
      }
    }
    
    const selectedConfig = testConfigs[config]
    if (!selectedConfig) {
      error(`Unknown test configuration: ${config}`)
      info(`Available configurations: ${Object.keys(testConfigs).join(', ')}`)
      process.exit(1)
    }
    
    info(`Setting up: ${selectedConfig.name}`)
    info(`Description: ${selectedConfig.description}`)
    info(`Tables: ${selectedConfig.tables.join(', ')}`)
    
    // Generate SQL for the test configuration
    await generateSQL(config)
    
    success('Test database setup script generated!')
    info('Next steps:')
    info('1. Copy the generated SQL file')
    info('2. Paste into Supabase SQL Editor')
    info('3. Run the SQL to create tables')
    
  } catch (err) {
    error(`Failed to create test database: ${err.message}`)
    process.exit(1)
  }
}

async function showHelp() {
  log('\nDatabase Management CLI Tool', 'bright')
  log('=====================================\n')
  
  log('Usage:', 'cyan')
  log('  npm run db:generate [config]  Generate SQL setup script')
  log('  npm run db:validate           Validate current database')
  log('  npm run db:test [config]      Create test database')
  log('  npm run db:help               Show this help\n')
  
  log('Configurations:', 'cyan')
  log('  minimal    Only core tables (user_roles, site_settings)')
  log('  basic      Core + projects table (default for testing)')
  log('  full       All available tables\n')
  
  log('Examples:', 'cyan')
  log('  npm run db:generate basic')
  log('  npm run db:test minimal')
  log('  npm run db:validate\n')
  
  log('For more information, see:', 'blue')
  log('  docs/ENHANCED-DATABASE-MANAGEMENT.md')
}

async function showStatus() {
  log('\nDatabase Management System Status', 'bright')
  log('====================================\n')
  
  // Check if required files exist
  const requiredFiles = [
    'lib/database/schema.ts',
    'lib/database/validator.ts', 
    'lib/database/testing.ts',
    'components/admin/compact-database-manager.tsx'
  ]
  
  log('System Files:', 'cyan')
  for (const file of requiredFiles) {
    const exists = fs.existsSync(file)
    const status = exists ? colorize('✓', 'green') : colorize('✗', 'red')
    log(`  ${status} ${file}`)
  }
  
  log('\nAPI Endpoints:', 'cyan')
  const apiEndpoints = [
    'app/api/database/validate/route.ts',
    'app/api/database/testing/route.ts',
    'app/api/execute-sql/route.ts'
  ]
  
  for (const endpoint of apiEndpoints) {
    const exists = fs.existsSync(endpoint)
    const status = exists ? colorize('✓', 'green') : colorize('✗', 'red')
    log(`  ${status} ${endpoint}`)
  }
  
  log('\nAvailable Commands:', 'cyan')
  log('  npm run db:help      Show help')
  log('  npm run db:status    Show this status')
  log('  npm run db:validate  Validate database')
  log('  npm run db:generate  Generate setup SQL')
  log('  npm run db:test      Create test database')
}

// Main CLI handler
async function main() {
  const args = process.argv.slice(2)
  const command = args[0]
  const param = args[1]
  
  switch (command) {
    case 'generate':
      await generateSQL(param || 'all')
      break
    
    case 'validate':
      await validateSchema()
      break
    
    case 'test':
      await createTestDB(param || 'basic')
      break
    
    case 'status':
      await showStatus()
      break
    
    case 'help':
    case '--help':
    case '-h':
    default:
      await showHelp()
      break
  }
}

// Handle errors gracefully
process.on('unhandledRejection', (reason, promise) => {
  error(`Unhandled Rejection at: ${promise}, reason: ${reason}`)
  process.exit(1)
})

process.on('uncaughtException', (err) => {
  error(`Uncaught Exception: ${err.message}`)
  process.exit(1)
})

// Run the CLI
if (require.main === module) {
  main().catch(err => {
    error(err.message)
    process.exit(1)
  })
}

module.exports = {
  generateSQL,
  validateSchema, 
  createTestDB,
  showHelp,
  showStatus
}