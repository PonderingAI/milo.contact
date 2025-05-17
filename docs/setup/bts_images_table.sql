-- Create BTS images table if it doesn't exist
CREATE TABLE IF NOT EXISTS bts_images (
  id SERIAL PRIMARY KEY,
  project_id INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  is_video BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add index for faster queries
CREATE INDEX IF NOT EXISTS idx_bts_images_project_id ON bts_images(project_id);

-- Add comment to table
COMMENT ON TABLE bts_images IS 'Stores behind-the-scenes images and videos for projects';

-- Add comments to columns
COMMENT ON COLUMN bts_images.id IS 'Primary key for the BTS image';
COMMENT ON COLUMN bts_images.project_id IS 'Foreign key to the projects table';
COMMENT ON COLUMN bts_images.url IS 'URL of the BTS image or video';
COMMENT ON COLUMN bts_images.is_video IS 'Flag indicating if this is a video (true) or image (false)';
COMMENT ON COLUMN bts_images.created_at IS 'Timestamp when the record was created';
COMMENT ON COLUMN bts_images.updated_at IS 'Timestamp when the record was last updated';
