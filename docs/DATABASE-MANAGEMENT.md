# Database Management Guide

This document explains how to manage database tables and add new entities to the Milo Presedo Portfolio application.

## Overview

The application uses a centralized database schema management system that:

1. Defines all database tables in a single configuration file
2. Organizes tables by category
3. Manages dependencies between tables
4. Provides SQL files for table creation
5. Integrates with the universal SQL setup popup

## Adding a New Database Table

### Step 1: Create the SQL File

First, create or update an SQL file in the `docs/setup` directory. Group related tables in the same file.

Example: `docs/setup/my-feature-tables.sql`

\`\`\`sql
-- Create my_new_table
CREATE TABLE IF NOT EXISTS my_new_table (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add RLS policies
ALTER TABLE my_new_table ENABLE ROW LEVEL SECURITY;

-- Allow public read access
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'my_new_table' AND policyname = 'public_read_my_new_table'
  ) THEN
    CREATE POLICY "public_read_my_new_table"
    ON my_new_table
    FOR SELECT
    TO public
    USING (true);
  END IF;
EXCEPTION WHEN OTHERS THEN
  -- Policy already exists or other error
END $$;

-- Allow authenticated users with admin role to manage my_new_table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'my_new_table' AND policyname = 'admins_manage_my_new_table'
  ) THEN
    CREATE POLICY "admins_manage_my_new_table"
    ON my_new_table
    FOR ALL
    TO authenticated
    USING (
      EXISTS (
        SELECT 1 FROM user_roles
        WHERE user_id = auth.uid() 
        AND role = 'admin'
      )
    );
  END IF;
EXCEPTION WHEN OTHERS THEN
  -- Policy already exists or other error
END $$;
\`\`\`

### Step 2: Register the Table in the Schema Configuration

Add your table to the `DATABASE_TABLES` array in `lib/database-schema.ts`:

\`\`\`typescript
export const DATABASE_TABLES: TableDefinition[] = [
  // ... existing tables ...
  
  // Your new table
  {
    name: "my_new_table",
    displayName: "My New Table",
    description: "Stores information for my new feature",
    category: "content", // Choose an appropriate category
    required: false,     // Set to true if it's required for basic functionality
    dependencies: ["user_roles"], // List tables this one depends on
    sqlFile: "docs/setup/my-feature-tables.sql"
  },
]
\`\`\`

### Step 3: Create TypeScript Types (Optional)

Create TypeScript types for your table in an appropriate file:

\`\`\`typescript
// lib/my-feature-types.ts
export interface MyNewTable {
  id: string;
  name: string;
  description: string | null;
  created_at: string;
  updated_at: string;
}
\`\`\`

### Step 4: Create API Routes

Create API routes for interacting with your table:

\`\`\`typescript
// app/api/my-feature/route.ts
import { NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase-server"
import { getTablesForSection } from "@/lib/database-schema"

export async function GET() {
  try {
    // Check if required tables exist
    const requiredTables = getTablesForSection('my-feature').map(table => table.name)
    const response = await fetch("/api/direct-table-check", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ tables: requiredTables }),
    })

    const checkResult = await response.json()
    
    if (!checkResult.allExist) {
      return NextResponse.json({
        setupNeeded: true,
        missingTables: checkResult.missingTables,
        message: "Required tables are missing. Please set up the database."
      })
    }

    // If tables exist, proceed with the actual API logic
    const supabase = createAdminClient()
    const { data, error } = await supabase.from("my_new_table").select("*")

    if (error) {
      throw error
    }

    return NextResponse.json({ data })
  } catch (error) {
    console.error("Error in my-feature API:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    )
  }
}
\`\`\`

### Step 5: Create UI Components

Create UI components that use the setup popup when needed:

\`\`\`tsx
// components/my-feature/my-feature-component.tsx
"use client"

import { useState, useEffect } from "react"
import { SetupTablesPopup } from "@/components/setup-tables-popup"
import { getTablesForSection } from "@/lib/database-schema"

export function MyFeatureComponent() {
  const [setupNeeded, setSetupNeeded] = useState(false)
  const [missingTables, setMissingTables] = useState<string[]>([])
  const [data, setData] = useState<any[]>([])
  
  // Get required tables for this feature
  const requiredTables = getTablesForSection('my-feature').map(table => table.name)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    const response = await fetch("/api/my-feature")
    const result = await response.json()
    
    if (result.setupNeeded) {
      setSetupNeeded(true)
      setMissingTables(result.missingTables || [])
    } else {
      setData(result.data || [])
    }
  }

  const handleSetupComplete = () => {
    setSetupNeeded(false)
    fetchData()
  }

  if (setupNeeded) {
    return (
      <div>
        <h2>Setup Required</h2>
        <p>This feature requires database setup.</p>
        <SetupTablesPopup
          requiredTables={requiredTables}
          onSetupComplete={handleSetupComplete}
        />
      </div>
    )
  }

  return (
    <div>
      {/* Your feature UI */}
    </div>
  )
}
\`\`\`

## Database Categories

The system organizes tables into the following categories:

- **core**: Essential tables required for basic functionality
- **content**: Tables for storing content like projects, posts, etc.
- **media**: Tables for media files and assets
- **security**: Tables for security features
- **dependencies**: Tables for dependency management
- **other**: Miscellaneous tables

## Best Practices

1. **Group Related Tables**: Keep related tables in the same SQL file
2. **Use RLS Policies**: Always add Row Level Security policies
3. **Add Indexes**: Add indexes for frequently queried columns
4. **Check Dependencies**: Make sure to list all dependencies correctly
5. **Use UUID Primary Keys**: Use UUIDs for primary keys when possible
6. **Add Timestamps**: Include created_at and updated_at fields
7. **Document Your Tables**: Add clear descriptions in the schema configuration

## Troubleshooting

If you encounter issues with database setup:

1. Check the browser console for errors
2. Verify that your SQL syntax is correct
3. Make sure all dependencies are properly defined
4. Check that the SQL file path is correct
5. Verify that the table name matches in all places

## Example: Complete Feature Addition

Here's a complete example of adding a blog feature:

1. Create SQL file: `docs/setup/blog-tables.sql`
2. Add tables to schema configuration
3. Create TypeScript types
4. Create API routes
5. Create UI components
6. Test the feature with and without tables

See the code samples in this guide for details on each step.
\`\`\`

Finally, let's update the CODE_OVERVIEW.md file to include information about the new database management system:
