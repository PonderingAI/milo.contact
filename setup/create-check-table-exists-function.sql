-- Function to check if a table exists
CREATE OR REPLACE FUNCTION check_table_exists(table_name text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = table_name
  );
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION check_table_exists(text) TO authenticated;
GRANT EXECUTE ON FUNCTION check_table_exists(text) TO anon;
GRANT EXECUTE ON FUNCTION check_table_exists(text) TO service_role;
