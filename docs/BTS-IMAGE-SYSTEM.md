# Behind the Scenes (BTS) Image System

This document provides an overview of the Behind the Scenes (BTS) image system in the portfolio application, including how BTS images are stored, managed, and displayed.

## Overview

The BTS image system allows users to add behind-the-scenes images to projects, providing additional context and visual content beyond the main project media. These images are displayed in a gallery section on the project detail page.

## Database Schema

BTS images are stored in the `bts_images` table with the following structure:

\`\`\`sql
CREATE TABLE bts_images (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  caption TEXT,
  category TEXT DEFAULT 'general',
  sort_order INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
\`\`\`

Key fields:
- `id`: Unique identifier for the BTS image
- `project_id`: Reference to the associated project
- `image_url`: URL of the BTS image
- `caption`: Optional caption for the image
- `category`: Category for organizing BTS images (e.g., "setup", "filming", "crew")
- `sort_order`: Order in which the images should be displayed

## Components

### BTS Image Manager

The `BTSImageManager` component (`components/admin/bts-image-manager.tsx`) allows administrators to:
- View all BTS images for a project
- Add new BTS images
- Edit image captions and categories
- Delete BTS images

### Project Detail Content

The `ProjectDetailContent` component (`app/projects/[id]/project-detail-content.tsx`) displays BTS images in a gallery section on the project detail page.

## API Routes

### BTS Image API

The BTS image API (`app/api/projects/bts-images/route.ts`) handles:
- Adding BTS images to a project
- Updating BTS image details
- Deleting BTS images

## Data Flow

1. **Creation**: BTS images are added through the `BTSImageManager` component or during project creation/editing
2. **Storage**: Images are stored in the `bts_images` table in the database
3. **Retrieval**: The `getProjectById` function retrieves BTS images along with project data
4. **Display**: The `ProjectDetailContent` component displays BTS images in a gallery section

## Known Issues

1. **Field Name Inconsistencies**: There may be inconsistencies in how BTS image fields are named across components
2. **Error Handling**: Error handling for BTS image retrieval and display could be improved
3. **Mixed Media Types**: The system doesn't clearly distinguish between BTS images and videos

## Troubleshooting

If BTS images aren't displaying:
1. Check that the `bts_images` table exists and has the correct schema
2. Verify that BTS images are being correctly saved to the database
3. Check for errors in the BTS image retrieval process
4. Ensure the `ProjectDetailContent` component is correctly handling BTS images
5. Look for any console errors related to BTS image loading or display
