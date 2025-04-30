-- Function to create the site_settings table
CREATE OR REPLACE FUNCTION create_site_settings_table()
RETURNS void AS $$
BEGIN
  CREATE TABLE IF NOT EXISTS site_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    key TEXT NOT NULL UNIQUE,
    value TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
  );
  
  -- Create an index on the key column for faster lookups
  CREATE INDEX IF NOT EXISTS idx_site_settings_key ON site_settings(key);
END;
$$ LANGUAGE plpgsql;
