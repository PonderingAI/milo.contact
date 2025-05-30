# Media Storage and Retrieval

This document explains how images, videos, and other media files are stored and retrieved in the Milo Presedo Portfolio application.

## Storage Architecture

### Overview

The application uses Supabase for both database and file storage:

1. **File Storage**: Media files are stored in Supabase Storage buckets
2. **Metadata Storage**: Information about media files is stored in the `media` table in the Supabase database
3. **References**: Other tables (like `projects`) reference media files using their public URLs

### Storage Buckets

The application uses the following storage buckets:

- **media**: For general media uploads (created automatically during setup)
- **public**: For public assets like favicons and site images

### Media Table Schema

The `media` table stores metadata about all uploaded files:

| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| filename | text | Original filename |
| filepath | text | Path in storage bucket |
| filesize | integer | File size in bytes |
| filetype | text | Type of file (image, video, vimeo, other) |
| public_url | text | Public URL to access the file |
| thumbnail_url | text | URL for thumbnail (same as public_url for images) |
| tags | text[] | Array of tags for categorization |
| metadata | jsonb | Additional metadata (content type, dimensions, etc.) |
| usage_locations | jsonb | Where the file is used in the site |
| created_at | timestamp | When the file was uploaded |

## WebP Conversion

All uploaded images are automatically converted to WebP format for optimal performance:

1. When an image is uploaded, it's sent to the `/api/convert-to-webp` endpoint
2. The image is converted to WebP using the Sharp library with 90% quality (high quality for large displays)
3. The WebP version is stored in Supabase Storage
4. The metadata is saved to the `media` table

### Conversion Settings

- **Quality**: 90% (high quality for large displays)
- **Format**: WebP (modern, efficient format with wide browser support)
- **Naming**: Original filename + timestamp + .webp extension

## Retrieving Media

### Public URLs

All media files have a public URL that can be used to access them directly. These URLs are stored in the `public_url` column of the `media` table.

Example URL format:
\`\`\`
https://[PROJECT_REF].supabase.co/storage/v1/object/public/media/uploads/image-1234567890.webp
\`\`\`

### Copying URLs

The Media Library in the admin panel provides an easy way to copy media URLs:

1. Navigate to Admin > Media
2. Find the media item you want to use
3. Click the "Copy URL" button
4. The URL is copied to your clipboard and can be used anywhere

### Previewing Images

You can preview images in the Media Library by clicking on them. This opens a dialog with:
- A larger preview of the image
- The image URL
- The file path
- A copy URL button

## Using Media in the Application

### In Projects

When creating or editing a project, you can:
1. Upload new images directly
2. Select existing images from the media library
3. Add Vimeo videos by URL

### In Site Settings

Site settings (like hero background, profile image) can use:
1. Uploaded images (stored in the `public` bucket)
2. Vimeo videos (for video backgrounds)

## Media Types and Support

### Supported Image Formats

The following image formats are supported for upload:
- JPEG/JPG
- PNG
- GIF
- WebP (no conversion needed)
- AVIF

All non-WebP images are automatically converted to WebP for better performance.

### Video Support

The application supports:
- Vimeo videos (embedded via URL)
- Direct video uploads (MP4, WebM)

## Best Practices

1. **Use the Media Library**: Always use the Media Library to manage and retrieve media files
2. **Copy URLs**: Use the Copy URL feature to get the correct URL for media files
3. **WebP Format**: Let the system convert images to WebP automatically for best performance
4. **Vimeo for Videos**: Use Vimeo for hosting videos when possible for better performance

## Technical Implementation

### Upload Process

1. User selects a file in the Media Library
2. If it's an image (not SVG/WebP/GIF), it's sent to the WebP conversion API
3. The file is uploaded to Supabase Storage
4. Metadata is saved to the `media` table
5. The public URL is generated and stored

### Retrieval Process

1. Media items are fetched from the `media` table
2. The `public_url` field contains the direct URL to the file
3. This URL can be used in `<img>` tags, CSS backgrounds, or anywhere a URL is needed

## Troubleshooting

### Missing Images

If images are not displaying:
1. Check if the file exists in Supabase Storage
2. Verify the public URL is correct
3. Ensure the bucket has public access enabled

### Upload Failures

If uploads are failing:
1. Check file size (max 5MB)
2. Verify the storage bucket exists
3. Check Supabase permissions
\`\`\`

Let's also update the README.md to include information about media storage:
