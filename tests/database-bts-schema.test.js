/**
 * Database Schema Integration Test
 * 
 * Tests that the database schema includes the missing bts_images table
 * and that all related functionality has the proper structure.
 */

// Import the schema
const { tableConfigs, getAllTables, getTableConfig } = require('../lib/database/schema.ts')

describe('Database Schema BTS Images Integration', () => {
  test('bts_images table should be properly defined in schema', () => {
    const btsImagesTable = getTableConfig('bts_images')
    
    expect(btsImagesTable).toBeDefined()
    expect(btsImagesTable.name).toBe('bts_images')
    expect(btsImagesTable.displayName).toBe('Behind the Scenes Images')
    expect(btsImagesTable.category).toBe('content')
    expect(btsImagesTable.dependencies).toContain('projects')
    expect(btsImagesTable.dependencies).toContain('user_roles')
  })

  test('bts_images table should have correct columns', () => {
    const btsImagesTable = getTableConfig('bts_images')
    
    expect(btsImagesTable.columns).toBeDefined()
    
    const columnNames = btsImagesTable.columns.map(col => col.name)
    expect(columnNames).toContain('id')
    expect(columnNames).toContain('project_id')
    expect(columnNames).toContain('image_url')
    expect(columnNames).toContain('caption')
    expect(columnNames).toContain('category')
    expect(columnNames).toContain('sort_order')
    expect(columnNames).toContain('created_at')
    expect(columnNames).toContain('updated_at')
  })

  test('bts_images table should have proper SQL definition', () => {
    const btsImagesTable = getTableConfig('bts_images')
    
    expect(btsImagesTable.sql).toBeDefined()
    expect(btsImagesTable.sql).toContain('CREATE TABLE IF NOT EXISTS bts_images')
    expect(btsImagesTable.sql).toContain('project_id UUID REFERENCES projects(id) ON DELETE CASCADE')
    expect(btsImagesTable.sql).toContain('image_url TEXT NOT NULL')
    expect(btsImagesTable.sql).toContain('ALTER TABLE bts_images ENABLE ROW LEVEL SECURITY')
  })

  test('media table should be properly defined with correct fields', () => {
    const mediaTable = getTableConfig('media')
    
    expect(mediaTable).toBeDefined()
    expect(mediaTable.name).toBe('media')
    expect(mediaTable.category).toBe('media')
    
    const columnNames = mediaTable.columns.map(col => col.name)
    expect(columnNames).toContain('public_url')
    expect(columnNames).toContain('filepath')
    expect(columnNames).toContain('filetype')
    expect(columnNames).toContain('metadata')
    expect(columnNames).toContain('tags')
  })

  test('all required tables should be present in schema', () => {
    const allTables = getAllTables()
    const tableNames = allTables.map(table => table.name)
    
    expect(tableNames).toContain('user_roles')
    expect(tableNames).toContain('site_settings')
    expect(tableNames).toContain('projects')
    expect(tableNames).toContain('bts_images')
    expect(tableNames).toContain('media')
    expect(tableNames).toContain('dependencies')
  })

  test('projects table should have proper foreign key relationships', () => {
    const projectsTable = getTableConfig('projects')
    const btsImagesTable = getTableConfig('bts_images')
    const mediaTable = getTableConfig('media')
    
    expect(projectsTable).toBeDefined()
    
    // Check that bts_images and media tables reference projects
    expect(btsImagesTable.sql).toContain('REFERENCES projects(id)')
    expect(mediaTable.sql).toContain('REFERENCES projects(id)')
    
    // Check that projects table has the fields needed for BTS functionality
    const projectColumns = projectsTable.columns.map(col => col.name)
    expect(projectColumns).toContain('id')
    expect(projectColumns).toContain('title')
    expect(projectColumns).toContain('image')
    expect(projectColumns).toContain('thumbnail_url')
  })

  test('database schema should have proper RLS policies for BTS images', () => {
    const btsImagesTable = getTableConfig('bts_images')
    
    expect(btsImagesTable.policies).toBeDefined()
    expect(btsImagesTable.policies).toContain('public_read_bts_images')
    expect(btsImagesTable.policies).toContain('admins_manage_bts_images')
    
    // Check SQL contains the policies
    expect(btsImagesTable.sql).toContain('CREATE POLICY "public_read_bts_images"')
    expect(btsImagesTable.sql).toContain('CREATE POLICY "admins_manage_bts_images"')
  })

  test('schema should include proper indexes for performance', () => {
    const btsImagesTable = getTableConfig('bts_images')
    const mediaTable = getTableConfig('media')
    
    expect(btsImagesTable.indexes).toContain('idx_bts_images_project_id')
    expect(btsImagesTable.indexes).toContain('idx_bts_images_sort_order')
    
    expect(mediaTable.indexes).toContain('idx_media_project_id')
    expect(mediaTable.indexes).toContain('idx_media_public_url')
    expect(mediaTable.indexes).toContain('idx_media_tags')
  })
})