# Database Setup System

This document explains the unified database setup system used in the Milo Presedo Portfolio application.

## Overview

The database setup system is designed to:

1. Automatically detect missing database tables
2. Generate the necessary SQL to create those tables
3. Provide both automatic and manual setup options
4. Only show setup requirements relevant to the current section
5. Handle dependencies between tables

## Key Components

### Database Setup Popup (`components/admin/database-setup-popup.tsx`)

This is the main component that handles the database setup process. It:

- Checks which tables exist and which are missing
- Generates SQL for missing tables
- Provides a user-friendly interface for setup
- Handles automatic table creation
- Manages dependencies between tables

### Admin Database Check (`app/admin/admin-database-check.tsx`)

This component is included in the admin layout and:

- Determines which tables are required for the current admin section
- Triggers the database setup popup when necessary
- Passes the required tables to the popup

### Check Table Exists API (`app/api/check-table-exists/route.ts`)

This API route:

- Checks if a specific table exists in the database
- Returns a simple JSON response with the result

### Execute SQL API (`app/api/execute-sql/route.ts`)

This API route:

- Executes SQL statements in the database
- Used for automatic table creation
- Handles errors and returns appropriate responses

## Table Configuration

Tables are defined in the `database-setup-popup.tsx` file with the following properties:

- `name`: Internal name of the table
- `displayName`: User-friendly name shown in the UI
- `description`: Brief description of the table's purpose
- `sql`: The SQL needed to create the table
- `dependencies`: Array of other tables this table depends on
- `required`: Whether the table is required for basic functionality
- `category`: Logical grouping of the table

## How It Works

1. When an admin visits any admin page, the system checks which tables are required for that specific section
2. It then checks which of those tables already exist in the database
3. If any required tables are missing, the popup appears automatically
4. The admin can select which tables they want to create (required tables can't be deselected)
5. The system generates the SQL code with proper dependencies
6. The admin can copy the SQL and run it in Supabase, or try the automatic execution

## Adding New Tables

To add a new table to the system:

1. Add a new entry to the `allTables` array in `database-setup-popup.tsx`
2. Define the table properties including SQL and dependencies
3. Assign it to an appropriate category
4. Update the `SECTION_REQUIREMENTS` in `admin-database-check.tsx` if the table should be required for specific admin sections

## User Experience

The system is designed to be user-friendly for non-technical users:

- Clear instructions are provided
- SQL can be copied with a single click
- Automatic setup is available
- Only necessary tables are shown
- Required tables are clearly marked
- Dependencies are handled automatically

## Troubleshooting

If tables fail to create automatically:

1. Check the browser console for errors
2. Try the manual setup option by copying the SQL
3. Verify database permissions
4. Check if the SQL syntax is compatible with your database version

## Security Considerations

The execute-sql API route should only be accessible to authenticated users with admin privileges. This is enforced through:

1. Middleware that checks authentication
2. API route that verifies admin role
3. Row-level security policies in the database

## Conclusion

This unified database setup system replaces multiple separate setup components and files, making the codebase more maintainable and providing a better user experience.
