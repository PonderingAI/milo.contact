# Media Upload System Documentation

## Overview
The media upload system in the portfolio application handles uploading, processing, and displaying media files (images and videos) for projects. This document outlines the key components and their interactions.

## Key Components

### 1. Project Media Uploader (`components/admin/project-media-uploader.tsx`)
- **Purpose**: Provides the UI for uploading media files to projects
- **Features**:
  - Drag-and-drop file upload
  - Image preview functionality
  - Progress indicators
  - Error handling
  - Media type detection

### 2. Unified Media Library (`components/admin/unified-media-library.tsx`)
- **Purpose**: Provides access to previously uploaded media
- **Features**:
  - Media browsing and selection
  - Search and filtering
  - Preview of media items
  - Selection of media for projects

### 3. Project Editor (`components/admin/project-editor.tsx`)
- **Purpose**: Main interface for creating and editing projects
- **Features**:
  - Integrates the media uploader
  - Manages project metadata
  - Handles form submission

### 4. API Routes
- **Bulk Upload** (`app/api/bulk-upload/route.ts`): Handles multiple file uploads
- **Process Video URL** (`app/api/process-video-url/route.ts`): Extracts information from video URLs
- **Check Media Duplicate** (`app/api/check-media-duplicate/route.ts`): Prevents duplicate uploads

## Data Flow

1. User selects files or provides video URLs in the Project Media Uploader
2. Files are validated and previewed in the UI
3. On form submission, files are sent to the Bulk Upload API
4. API processes files and stores them in Supabase storage
5. Media metadata is stored in the database
6. Project is updated with references to the media

## Best Practices

1. **Image Previews**: Always maintain the image preview functionality for uploaded media
2. **Progress Indicators**: Provide clear feedback during upload process
3. **Error Handling**: Gracefully handle upload failures and provide clear error messages
4. **Validation**: Validate file types and sizes before upload
5. **Optimization**: Optimize images for web display

## Future Improvements

1. Implement client-side image compression
2. Add support for more video platforms
3. Improve the media organization system
4. Add tagging and categorization for media
5. Implement batch operations for media management
