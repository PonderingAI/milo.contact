CREATE OR REPLACE FUNCTION create_site_settings_table()
RETURNS void AS $$
BEGIN
  -- Create the site_settings table if it doesn't exist
  CREATE TABLE IF NOT EXISTS site_settings (
    key TEXT PRIMARY KEY,
    value TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
  );
  
  -- Create a trigger to update the updated_at column
  CREATE OR REPLACE FUNCTION update_site_settings_updated_at()
  RETURNS TRIGGER AS $$
  BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
  END;
  $$ LANGUAGE plpgsql;
  
  -- Drop the trigger if it exists
  DROP TRIGGER IF EXISTS update_site_settings_updated_at_trigger ON site_settings;
  
  -- Create the trigger
  CREATE TRIGGER update_site_settings_updated_at_trigger
  BEFORE UPDATE ON site_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_site_settings_updated_at();
END;
$$ LANGUAGE plpgsql;
