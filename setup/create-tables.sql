-- Create projects table
CREATE TABLE IF NOT EXISTS projects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  category TEXT NOT NULL,
  type TEXT NOT NULL,
  role TEXT NOT NULL,
  image TEXT NOT NULL,
  video_url TEXT,
  description TEXT,
  special_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create BTS images table
CREATE TABLE IF NOT EXISTS bts_images (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  caption TEXT,
  size TEXT,
  aspect_ratio TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
