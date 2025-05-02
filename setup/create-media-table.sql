-- Create media table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.media (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    filename TEXT NOT NULL,
    filepath TEXT NOT NULL,
    filesize INTEGER NOT NULL,
    filetype TEXT NOT NULL,
    public_url TEXT NOT NULL,
    thumbnail_url TEXT,
    tags TEXT[] DEFAULT '{}',
    metadata JSONB DEFAULT '{}'::jsonb,
    usage_locations JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add index on filepath for faster lookups
CREATE INDEX IF NOT EXISTS media_filepath_idx ON public.media(filepath);

-- Add index on filetype for filtering
CREATE INDEX IF NOT EXISTS media_filetype_idx ON public.media(filetype);

-- Add index on tags for filtering
CREATE INDEX IF NOT EXISTS media_tags_idx ON public.media USING GIN(tags);

-- Add function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_modified_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add trigger to update the updated_at timestamp
DROP TRIGGER IF EXISTS update_media_modtime ON public.media;
CREATE TRIGGER update_media_modtime
BEFORE UPDATE ON public.media
FOR EACH ROW
EXECUTE FUNCTION update_modified_column();
