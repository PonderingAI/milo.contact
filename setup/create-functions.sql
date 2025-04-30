-- Function to create BTS images table
CREATE OR REPLACE FUNCTION create_bts_images_table()
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  -- Create BTS images table
  CREATE TABLE IF NOT EXISTS bts_images (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    image_url TEXT NOT NULL,
    caption TEXT,
    size TEXT DEFAULT 'medium',
    aspect_ratio TEXT DEFAULT 'landscape',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
  );

  -- Create index for faster queries
  CREATE INDEX IF NOT EXISTS idx_bts_images_project_id ON bts_images(project_id);
END;
$$;
