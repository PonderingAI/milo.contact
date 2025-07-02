-- Migration: Create main_media table for multiple main media support
-- Description: This table stores multiple main images/videos for projects
-- similar to the existing bts_images table structure

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
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_main_media_project_id ON main_media(project_id);
CREATE INDEX IF NOT EXISTS idx_main_media_display_order ON main_media(project_id, display_order);

-- Set up Row Level Security (RLS) policies
ALTER TABLE main_media ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Enable read access for all users" ON main_media;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON main_media;
DROP POLICY IF EXISTS "Enable update for authenticated users only" ON main_media;
DROP POLICY IF EXISTS "Enable delete for authenticated users only" ON main_media;

-- Create RLS policies
CREATE POLICY "Enable read access for all users" ON main_media
  FOR SELECT USING (true);

CREATE POLICY "Enable insert for authenticated users only" ON main_media
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Enable update for authenticated users only" ON main_media
  FOR UPDATE USING (true);

CREATE POLICY "Enable delete for authenticated users only" ON main_media
  FOR DELETE USING (true);