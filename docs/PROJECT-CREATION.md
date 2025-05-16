# Project Creation Documentation

This document explains how the project creation system works in the portfolio application.

## Overview

The project creation system allows administrators to create and manage portfolio projects. Projects are stored in the Supabase database in the `projects` table.

## Required Fields

Each project requires the following fields:

- **title**: The title of the project
- **image**: URL to the cover image
- **category**: The project category (e.g., "Short Film", "Music Video")
- **role**: Your role in the project (e.g., "Director", "Cinematographer")

Optional fields include:

- **description**: A detailed description of the project
- **thumbnail_url**: URL to a video (YouTube, Vimeo, or LinkedIn)
- **is_public**: Whether the project is publicly visible
- **publish_date**: When to automatically publish a private project

## How It Works

1. The form collects project information from the user
2. When submitted, the data is sent to the `/api/projects/create` API endpoint
3. The API validates that all required fields are present
4. If validation passes, the project is inserted into the database
5. On success, the user is redirected to the project edit page

## Troubleshooting

If you encounter errors when creating a project:

1. Check that all required fields are filled out
2. Ensure the image URL is valid
3. Check the browser console for detailed error messages
4. Verify that the Supabase connection is working

## Database Schema

The projects table has the following schema:

\`\`\`sql
CREATE TABLE projects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT,
  image TEXT NOT NULL,
  category TEXT NOT NULL,
  role TEXT NOT NULL,
  project_date DATE DEFAULT CURRENT_DATE,
  is_public BOOLEAN DEFAULT TRUE,
  publish_date TIMESTAMP WITH TIME ZONE,
  thumbnail_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
\`\`\`

## Media Management

Projects can include:

1. A cover image (required)
2. A video URL (optional)
3. Behind-the-scenes images (optional)

Media files are stored in Supabase Storage and referenced by URL in the database.
