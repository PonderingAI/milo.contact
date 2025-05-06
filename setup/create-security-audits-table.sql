-- Create security_audits table if it doesn't exist
CREATE TABLE IF NOT EXISTS security_audits (
  id SERIAL PRIMARY KEY,
  type VARCHAR(50) NOT NULL,
  results JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add comment to table
COMMENT ON TABLE security_audits IS 'Stores security audit logs and update history';
