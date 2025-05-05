"use client"

import { useState, useEffect } from "react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { AlertCircle, Copy, Check, ChevronDown, ChevronUp } from "lucide-react"
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter"
import { vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism"

const CONTACT_TABLE_SQL = `-- Create contact_messages table
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
ON contact_messages(read);`

export default function ContactTableSetupGuide() {
  const [isTableMissing, setIsTableMissing] = useState<boolean | null>(null)
  const [copied, setCopied] = useState(false)
  const [expanded, setExpanded] = useState(true)

  useEffect(() => {
    async function checkTable() {
      try {
        const res = await fetch("/api/check-table-exists?table=contact_messages")
        const data = await res.json()
        setIsTableMissing(!data.exists)
      } catch (error) {
        console.error("Error checking if contact_messages table exists:", error)
        setIsTableMissing(true) // Assume missing on error
      }
    }

    checkTable()
  }, [])

  const copyToClipboard = () => {
    navigator.clipboard.writeText(CONTACT_TABLE_SQL)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const tryCreateTable = async () => {
    try {
      const response = await fetch("/api/setup-contact-messages-table")
      const data = await response.json()

      if (data.success) {
        setIsTableMissing(false)
      } else {
        console.error("Failed to create table:", data.error)
        // Table still missing
      }
    } catch (error) {
      console.error("Error setting up contact_messages table:", error)
    }
  }

  if (isTableMissing === null) {
    return <div className="animate-pulse p-4 bg-gray-800/50 rounded-md">Checking database setup...</div>
  }

  if (!isTableMissing) {
    return null // Table exists, don't show anything
  }

  return (
    <Alert variant="destructive" className="mb-8 bg-red-900/20 border-red-800">
      <AlertCircle className="h-4 w-4" />
      <AlertTitle>Contact Messages Table Missing</AlertTitle>
      <AlertDescription className="flex flex-col gap-4">
        <p>
          The contact_messages table is missing from your database. This table is required for storing contact form
          submissions. Please run the following SQL in your Supabase SQL editor to create it.
        </p>

        <div className="flex items-center justify-between flex-wrap gap-2">
          <Button
            variant="outline"
            className="border-red-400 text-red-100 hover:bg-red-900/30"
            onClick={() => setExpanded(!expanded)}
          >
            {expanded ? "Hide SQL Code" : "Show SQL Code"}
            {expanded ? <ChevronUp className="ml-2 h-4 w-4" /> : <ChevronDown className="ml-2 h-4 w-4" />}
          </Button>

          <div className="flex gap-2">
            <Button
              variant="outline"
              className="border-red-400 text-red-100 hover:bg-red-900/30"
              onClick={copyToClipboard}
            >
              {copied ? <Check className="mr-2 h-4 w-4" /> : <Copy className="mr-2 h-4 w-4" />}
              {copied ? "Copied!" : "Copy SQL"}
            </Button>

            <Button
              variant="outline"
              className="border-green-600 text-green-300 hover:bg-green-900/30"
              onClick={tryCreateTable}
            >
              Create Table Automatically
            </Button>
          </div>
        </div>

        {expanded && (
          <div className="mt-2 max-h-96 overflow-auto rounded-md">
            <SyntaxHighlighter
              language="sql"
              style={vscDarkPlus}
              customStyle={{
                borderRadius: "0.375rem",
                fontSize: "0.875rem",
                margin: 0,
              }}
            >
              {CONTACT_TABLE_SQL}
            </SyntaxHighlighter>
          </div>
        )}
      </AlertDescription>
    </Alert>
  )
}
