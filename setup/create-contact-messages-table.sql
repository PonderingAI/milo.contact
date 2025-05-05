-- Create contact_messages table
CREATE TABLE IF NOT EXISTS contact_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  message TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  read BOOLEAN DEFAULT FALSE
);

-- Add RLS policies
ALTER TABLE contact_messages ENABLE ROW LEVEL SECURITY;

-- Allow anyone to insert messages
CREATE POLICY "Allow anyone to insert messages"
ON contact_messages
FOR INSERT
TO public
WITH CHECK (true);

-- Allow authenticated users with admin role to read all messages
CREATE POLICY "Allow admins to read messages"
ON contact_messages
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = auth.uid() 
    AND role = 'admin'
  )
);

-- Allow authenticated users with admin role to update messages
CREATE POLICY "Allow admins to update messages"
ON contact_messages
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = auth.uid() 
    AND role = 'admin'
  )
);

-- Create an index on created_at for sorting
CREATE INDEX IF NOT EXISTS idx_contact_messages_created_at
ON contact_messages(created_at DESC);

-- Create an index on read status for filtering
CREATE INDEX IF NOT EXISTS idx_contact_messages_read
ON contact_messages(read);
