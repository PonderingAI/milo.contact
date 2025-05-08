-- Function to execute SQL directly
-- This is a fallback for when RPC functions aren't available
CREATE OR REPLACE FUNCTION sql(query text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result json;
BEGIN
  EXECUTE query INTO result;
  RETURN result;
EXCEPTION WHEN OTHERS THEN
  RETURN json_build_object('error', SQLERRM);
END;
$$;

-- Create a dummy table for the RPC
CREATE TABLE IF NOT EXISTS _direct_sql_execution (
  id SERIAL PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Grant execute permission
GRANT EXECUTE ON FUNCTION sql(text) TO authenticated;
GRANT EXECUTE ON FUNCTION sql(text) TO service_role;
