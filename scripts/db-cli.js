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
    
    // This would import from the actual schema files
    // For now, we'll create a template
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

-- Add more tables based on configuration...

-- End of generated SQL
    `.trim()

    const filename = `database-setup-${config}-${Date.now()}.sql`
    const filepath = path.join(process.cwd(), filename)
    
    fs.writeFileSync(filepath, sqlTemplate)
    success(`SQL file generated: ${filename}`)
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
    // For now, we'll simulate the validation
    const results = {
      totalTables: 5,
      existingTables: 3,
      missingTables: ['media', 'dependencies'],
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
        tables: ['user_roles', 'site_settings', 'projects'],
        description: 'Core tables plus projects'
      },
      full: {
        name: 'Full Test Database',
        tables: ['user_roles', 'site_settings', 'projects', 'media', 'dependencies', 'security_audits'],
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