# Milo Presedo Portfolio

This is the portfolio website for Milo Presedo, showcasing film production and photography work.

## Features

- Responsive design optimized for all devices
- Project showcase with filtering by category
- Admin dashboard for content management
- Dynamic site settings management
- Custom favicon and app icon support
- Media library for image and video management
- Automatic WebP conversion for optimal image quality
- Authentication and role-based access control

## Media Library

The media library supports the following features:

- Upload images and other files (single or bulk upload)
- Add videos from multiple platforms:
  - Vimeo videos
  - YouTube videos (including youtube.com/watch?v=ID format)
  - LinkedIn videos
- Automatic WebP conversion for images
- Storage usage tracking
- Drag and drop file uploads
- Preview and manage media
- Copy media URLs for embedding

### Important Notes

- When making changes to the media library, always make minimal changes to fix specific issues
- Avoid complete rewrites of components unless absolutely necessary
- Test all functionality after making changes
- Ensure YouTube links in all formats are properly recognized
- Prevent duplicate video links from being added

## Media Management

The site includes a comprehensive media management system:

- **Automatic WebP Conversion**: All uploaded images are automatically converted to WebP format with high quality (90%) to ensure they look great on large displays while maintaining good performance.
- **Media Library**: A unified media library for managing all images and videos.
- **URL Copying**: Easy access to media URLs for use in other applications.
- **Vimeo Integration**: Add Vimeo videos directly to the media library.
- **Image Preview**: Preview images before using them.

For detailed information about media storage and retrieval, see [MEDIA-STORAGE.md](./MEDIA-STORAGE.md).

## App Icons and Favicons

The site supports custom app icons and favicons that persist across deployments. These are stored in the Supabase database and storage, ensuring they remain available even after updates to the site.

### How App Icons Work

1. Icons are uploaded through the admin dashboard
2. Files are stored in Supabase Storage in the `public/icons` directory
3. References to these icons are saved in the `site_settings` table with keys prefixed with `icon_`
4. The `DynamicFavicons` component loads these icons client-side
5. Default icons are used as fallback if custom icons aren't available

### Uploading New Icons

1. Generate a favicon package from [favicon-generator.org](https://www.favicon-generator.org/)
2. Upload the zip file through the Admin Dashboard > Settings > App Icons tab
3. The system will automatically extract and store all icons
4. Icons will be immediately available after upload

## Setup and Installation

### Prerequisites

- Node.js 18+ and npm
- Supabase account
- Vercel account (for deployment)

### Environment Variables

Create a `.env.local` file with the following variables:

\`\`\`
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key
BOOTSTRAP_SECRET=your-bootstrap-secret
\`\`\`

### Installation

1. Clone the repository
2. Install dependencies: `npm install`
3. Run the development server: `npm run dev`
4. Open [http://localhost:3000](http://localhost:3000)

### Database Setup

1. Visit `/setup` to initialize the database tables and storage buckets
2. Follow the on-screen instructions to complete setup

## Development

### Project Structure

- `/app` - Next.js App Router pages and API routes
- `/components` - Reusable React components
- `/lib` - Utility functions and shared code
- `/public` - Static assets
- `/setup` - Database setup SQL files
- `/docs` - Documentation files

### Key Components

- `DynamicFavicons` - Loads custom favicons from the database
- `AppIconsUploader` - Handles uploading and managing app icons
- `SiteInformationForm` - Manages site content and settings
- `UnifiedMediaLibrary` - Media management system

## Deployment

The site is deployed on Vercel. The app icons, media files, and site settings are stored in Supabase and will persist across deployments.

### Deployment Steps

1. Connect your GitHub repository to Vercel
2. Add the required environment variables
3. Deploy the site
4. Visit `/setup` on the deployed site to initialize the database

## License

All rights reserved. This code is not open for redistribution.
