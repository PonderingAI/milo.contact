# Code Overview - Milo Website Builder

This document provides a comprehensive overview of all files in the codebase, organized by functionality. Use this as a quick reference to understand what code already exists and how different parts of the framework relate to each other.

## Table of Contents

1. [Core Components](#core-components)
2. [Admin Components](#admin-components)
3. [UI Components](#ui-components)
4. [Pages](#pages)
5. [API Routes](#api-routes)
6. [Authentication & Security](#authentication--security)
7. [Database & Storage](#database--storage)
8. [Configuration Files](#configuration-files)
9. [Utilities & Helpers](#utilities--helpers)
10. [Documentation](#documentation)

## Core Components

These components form the main building blocks of the public-facing site.

| File Path | Description | Key Features |
|-----------|-------------|--------------|
| `components/hero-section.tsx` | Main hero/banner on the homepage | Supports both image and video backgrounds, dynamic text from site settings |
| `components/about-section.tsx` | About section on the homepage | Profile image and multi-paragraph text from site settings |
| `components/services-section.tsx` | Services grid on the homepage | Interactive service cards with project filtering |
| `components/contact-section.tsx` | Contact form section | Email submission, social links, integration with database |
| `components/project-category.tsx` | Grid of projects by category | Filtering, pagination, animations with Framer Motion |
| `components/project-card.tsx` | Individual project preview card | Thumbnail, title, role display, hover effects |
| `components/project-mini-card.tsx` | Smaller project card variant | Used in related projects and service popups |
| `components/video-player.tsx` | Embedded video player | Supports YouTube, Vimeo, responsive design |
| `components/custom-cursor.tsx` | Custom cursor effects | Custom cursor styling and animations |
| `components/media-hosting-guide.tsx` | Guide on hosting media | Instructions for users on hosting media |

## Admin Components

These components are used in the admin dashboard and management interfaces.

| File Path | Description | Key Features |
|-----------|-------------|--------------|
| `components/admin/bts-image-manager.tsx` | Behind-the-scenes image management | Upload, edit, delete BTS images for projects |
| `components/admin/image-uploader.tsx` | General image upload component | Direct upload to storage, progress indication |
| `components/admin/unified-media-library.tsx` | Complete media management | Browse, search, organize media assets |
| `components/admin/media-selector.tsx` | Media selection dialog | Select media from library for insertion |
| `components/admin/site-information-form.tsx` | Site settings editor | Edit all site content in a structured form |
| `components/admin/project-form.tsx` | Project creation/editing form | Metadata editing, image selection, validation |
| `components/admin/delete-project-button.tsx` | Project deletion with confirmation | Confirmation dialog, deletion with cascading effects |
| `components/admin/user-role-manager.tsx` | User role assignment | Add/remove roles from users |
| `components/admin/admin-check.tsx` | Admin permission verification | Checks if user has admin privileges |
| `components/admin/favicon-uploader.tsx` | Upload site favicon | Handles favicon image processing |
| `components/admin/app-icons-uploader.tsx` | Upload app icons | Handles app icon package upload |
| `components/admin/database-setup-popup.tsx` | Unified database setup | Checks for missing tables, generates SQL, handles setup |
| `components/admin/sidebar.tsx` | Admin navigation sidebar | Links to all admin sections |
| `components/admin/dependency-scanner.tsx` | Scans project dependencies | Analyzes NPM dependencies for updates |
| `components/admin/manual-dependency-entry.tsx` | Manual dependency management | Add dependencies manually |
| `components/admin/package-json-manager.tsx` | Package.json management | Edit and update package.json |
| `components/admin/vulnerability-details.tsx` | Security vulnerability details | Shows detailed security info |
| `components/admin/draggable-widget.tsx` | Draggable dashboard widget | Interactive dashboard components |
| `components/admin/widget-selector.tsx` | Widget selection interface | Add widgets to dashboard |

## UI Components

Reusable UI components from the design system.

| File Path | Description | Key Features |
|-----------|-------------|--------------|
| `components/ui/badge.tsx` | Small status indicator | Styling variants for different states |
| `components/ui/three-state-toggle.tsx` | Toggle with three states | Used for tristate selections |
| `components/ui/four-state-toggle.tsx` | Toggle with four states | Used for quarternary selections |
| `components/database-setup-alert.tsx` | Database setup notification | Alerts users to setup requirements |
| `components/dynamic-favicons.tsx` | Dynamic favicon component | Changes favicon based on settings |

## Pages

Page components that represent routes in the application.

| File Path | Description | Key Features |
|-----------|-------------|--------------|
| `app/page.tsx` | Homepage | Main landing page with all sections |
| `app/projects/page.tsx` | Projects listing page | Lists all projects with filtering |
| `app/projects/[id]/page.tsx` | Individual project detail | Shows complete project information |
| `app/projects/loading.tsx` | Projects page loading state | Loading UI for projects |
| `app/projects/projects-content.tsx` | Projects page content | Extracted content for better organization |
| `app/projects/[id]/project-detail-content.tsx` | Project detail content | Content for project detail page |
| `app/media-hosting/page.tsx` | Media hosting guide page | Instructions for media hosting |
| `app/backend-setup/page.tsx` | Backend setup guide | Instructions for setting up backend |
| `app/auth/callback/page.tsx` | Auth callback handler | Processes authentication callbacks |
| `app/auth/callback/loading.tsx` | Auth callback loading | Loading state for auth callback |
| `app/admin/page.tsx` | Admin dashboard | Main admin control panel |
| `app/admin/projects/page.tsx` | Projects management | List and manage all projects |
| `app/admin/projects/new/page.tsx` | New project creation | Create new projects |
| `app/admin/projects/[id]/edit/page.tsx` | Project editing | Edit existing projects |
| `app/admin/projects/[id]/edit-client/page.tsx` | Client-side project editing | Client-side components for project editing |
| `app/admin/projects/client-page.tsx` | Projects list client side | Client components for projects list |
| `app/admin/users/page.tsx` | User management | List and manage users |
| `app/admin/settings/page.tsx` | Site settings | Manage site-wide settings |
| `app/admin/settings/client-page.tsx` | Client-side settings | Client components for settings |
| `app/admin/media/page.tsx` | Media management | Browse and manage media |
| `app/admin/security/page.tsx` | Security center | Security monitoring and controls |
| `app/admin/security/client-page.tsx` | Client-side security | Dependency management and security monitoring |
| `app/admin/dependencies/page.tsx` | Dependency management | Manage package dependencies |
| `app/admin/dependencies/client-page.tsx` | Client-side dependencies | Client components for dependencies |
| `app/admin/not-found.tsx` | Admin 404 page | Admin-specific not found page |
| `app/admin/permission-denied/page.tsx` | Permission denied | Access denied page |
| `app/admin/static-fallback.tsx` | Static fallback | Fallback for static generation |
| `app/admin/bootstrap/page.tsx` | Admin bootstrap | Initial admin setup |
| `app/admin/seed-projects/page.tsx` | Project seeding | Seed sample projects |
| `app/admin/debug/debug-client.tsx` | Debug client | Client-side debugging tools |
| `app/admin/debug-database/page.tsx` | Database debugging | Tools for diagnosing database issues |
| `app/admin/layout.tsx` | Admin layout | Layout for all admin pages |
| `app/admin/admin-database-check.tsx` | Database check component | Checks for required tables in admin section |
| `app/debug/page.tsx` | Debug page | General debugging tools |
| `app/debug-clerk/page.tsx` | Clerk debugging | Auth provider debugging |
| `app/auth-test/page.tsx` | Auth testing | Authentication testing tools |
| `app/sign-in/[[...sign-in]]/page.tsx` | Sign in page | User login |
| `app/sign-up/[[...sign-up]]/page.tsx` | Sign up page | User registration |
| `app/setup/page.tsx` | Setup page | General setup instructions |
| `app/setup-database/page.tsx` | Database setup | Database setup guide |
| `app/layout.tsx` | Root layout | Main app layout wrapper with Analytics |

## API Routes

Server endpoints that provide data and functionality.

| File Path | Description | Relations |
|-----------|-------------|-----------|
| `app/api/setup-storage/route.ts` | Setup storage containers | Creates and configures storage buckets |
| `app/api/seed-database/route.ts` | Seed database with initial data | Populates database with sample data |
| `app/api/test-supabase/route.ts` | Test Supabase connection | Verifies database connectivity |
| `app/api/admin/create-user/route.ts` | Create new users | User creation with role assignment |
| `app/api/admin/update-password/route.ts` | Update user passwords | Password management |
| `app/api/admin/confirm-user/route.ts` | Confirm new users | User email confirmation |
| `app/api/admin/toggle-role/route.ts` | Toggle user roles | Role management |
| `app/api/webhook/route.ts` | Webhook handler | Processes external webhooks |
| `app/api/test-clerk/route.ts` | Test Clerk auth | Authentication provider testing |
| `app/api/test-auth/route.ts` | General auth testing | Authentication testing |
| `app/api/assign-admin/route.ts` | Assign admin role | Give users admin privileges |
| `app/api/setup-icons-bucket/route.ts` | Setup icons storage | Configure icon storage |
| `app/api/setup-media-storage-policy/route.ts` | Setup media storage policies | Configure storage access rules |
| `app/api/setup-all/route.ts` | Setup everything | One-click complete setup |
| `app/api/convert-to-webp/route.ts` | Convert images to WebP | Image optimization |
| `app/api/bulk-upload/route.ts` | Bulk media upload | Handles multiple file uploads |
| `app/api/setup-site-settings/route.ts` | Setup site settings table | Creates settings storage |
| `app/api/settings/route.ts` | Manage site settings | Get/set site configuration |
| `app/api/setup-database/route.ts` | Setup database | Complete database setup |
| `app/api/upload-app-icons/route.ts` | Upload app icons | Process app icon uploads |
| `app/api/favicon/route.ts` | Manage favicon | Get/set site favicon |
| `app/api/contact/route.ts` | Contact form submission | Process contact form data |
| `app/api/check-table/route.ts` | Check single table | Verify if a specific table exists |
| `app/api/direct-table-check/route.ts` | Check multiple tables | Verify if multiple tables exist |
| `app/api/list-all-tables/route.ts` | List all tables | Get all tables in the database |
| `app/api/execute-sql/route.ts` | Execute SQL statements | Direct SQL execution |
| `app/api/dependencies/route.ts` | Main dependencies API | Dependency system entry point |
| `app/api/dependencies/list/route.ts` | List dependencies | Get all dependencies |
| `app/api/dependencies/scan/route.ts` | Scan dependencies | Analyze project for dependencies |
| `app/api/dependencies/fallback-scan/route.ts` | Fallback dependency scan | Alternative scanning method |
| `app/api/dependencies/settings/route.ts` | Dependency settings | Manage dependency system config |
| `app/api/dependencies/lock/route.ts` | Lock dependencies | Prevent dependency changes |
| `app/api/dependencies/apply/route.ts` | Apply dependency updates | Update dependencies |
| `app/api/dependencies/update/route.ts` | Update specific dependency | Single dependency update |
| `app/api/dependencies/audit/route.ts` | Audit dependencies | Security audit |
| `app/api/dependencies/auto-update/route.ts` | Auto-update dependencies | Automatic updates |
| `app/api/dependencies/check-updates/route.ts` | Check for updates | Look for new versions |
| `app/api/dependencies/generate-package-json/route.ts` | Generate package.json | Create package.json file |
| `app/api/dependencies/scheduled-update/route.ts` | Scheduled updates | Periodic update checks |
| `app/api/dependencies/system-status/route.ts` | Dependency system status | Check system health |
| `app/api/dependencies/update-mode/route.ts` | Update dependency mode | Change update settings for a dependency |

## Authentication & Security

Files related to authentication, authorization, and security.

| File Path | Description | Key Features |
|-----------|-------------|--------------|
| `lib/auth-utils.ts` | Authentication utilities | Helper functions for auth |
| `lib/server-auth-utils.ts` | Server-side auth utilities | Server-specific auth helpers |
| `middleware.ts` | Next.js middleware | Route protection, redirects |
| `app/manifest.ts` | PWA manifest | Progressive Web App configuration |

## Database & Storage

Files that handle database operations and storage.

| File Path | Description | Key Features |
|-----------|-------------|--------------|
| `lib/supabase.ts` | Supabase client | Database connection utilities |
| `lib/supabase-browser.ts` | Browser-side Supabase client | Client-side database access |
| `lib/supabase-server.ts` | Server-side Supabase client | Server-side database access |
| `lib/project-data.ts` | Project data utilities | Project data processing helpers |
| `lib/database-schema.ts` | Database schema definition | Central registry of all database tables |

## Configuration Files

Files that configure the application and its dependencies.

| File Path | Description | Key Features |
|-----------|-------------|--------------|
| `tailwind.config.ts` | Tailwind CSS configuration | Design system settings |
| `next.config.mjs` | Next.js configuration | Framework settings |
| `app/globals.css` | Global CSS | Application-wide styles |
| `package.json` | NPM package definition | Dependencies list |
| `tsconfig.json` | TypeScript configuration | Type checking settings |
| `.env.example` | Environment variables example | Template for environment setup |
| `.env.local` | Local environment variables | Local configuration |
| `.npmrc` | NPM configuration | NPM settings for CI/CD |

## Utilities & Helpers

Helper functions and utilities used throughout the application.

| File Path | Description | Key Features |
|-----------|-------------|--------------|
| `lib/utils.ts` | General utilities | Various helper functions |
| `hooks/use-mobile.tsx` | Mobile detection | Responsive design helper |
| `hooks/use-toast.ts` | Toast notifications | User notification system |
| `types/global.d.ts` | Global type definitions | TypeScript types |

## Documentation

Documentation and guides for the application.

| File Path | Description | Key Features |
|-----------|-------------|--------------|
| `README.md` | Main documentation | Project overview and setup |
| `CHANGELOG.md` | Version history | Changes log |
| `CONTRIBUTING.md` | Contribution guide | How to contribute |
| `SECURITY.md` | Security guidelines | Security practices |
| `CULTURE.md` | Development culture | Team practices and principles |
| `docs/MEDIA-STORAGE.md` | Media storage guide | Media management documentation |
| `docs/EMAIL-SETUP.md` | Email setup guide | Email system configuration |
| `docs/DEPENDENCIES.md` | Dependencies guide | Dependency management documentation |
| `docs/SECURITY.md` | Security documentation | Detailed security information |
| `docs/TODO.md` | Todo list | Pending tasks |
| `docs/CODE_OVERVIEW.md` | Code overview | This document |
| `docs/DATABASE-SETUP.md` | Database setup guide | Documentation for the database setup system |
| `docs/DATABASE-MANAGEMENT.md` | Database management | Guide for managing database tables |
| `docs/DEPLOYMENT.md` | Deployment guide | Instructions for deploying the application |

## Feature Relationships

### Public Site Features

- **Homepage Flow**: `app/page.tsx` → `hero-section.tsx` → `about-section.tsx` → `services-section.tsx` → `contact-section.tsx`
- **Projects Display**: `projects/page.tsx` → `projects-content.tsx` → `project-category.tsx` → `project-card.tsx`
- **Project Details**: `projects/[id]/page.tsx` → `project-detail-content.tsx` → `video-player.tsx` (if video) → `project-mini-card.tsx` (for related projects)

### Admin Features

- **User Management**: `admin/users/page.tsx` → `user-role-manager.tsx` → `admin/toggle-role/route.ts`
- **Project Management**: `admin/projects/page.tsx` → `admin/projects/client-page.tsx` → `project-form.tsx` → `image-uploader.tsx` → `media-selector.tsx` → `unified-media-library.tsx`
- **Media Management**: `admin/media/page.tsx` → `unified-media-library.tsx` → `bulk-upload/route.ts` → `convert-to-webp/route.ts`
- **Site Settings**: `admin/settings/page.tsx` → `admin/settings/client-page.tsx` → `site-information-form.tsx` → `app-icons-uploader.tsx` → `favicon-uploader.tsx`
- **Security Center**: `admin/security/page.tsx` → `admin/security/client-page.tsx` → `dependency-scanner.tsx` → `vulnerability-details.tsx`
- **Dependency Management**: `admin/dependencies/page.tsx` → `admin/dependencies/client-page.tsx` → `dependency-scanner.tsx` → `manual-dependency-entry.tsx`

### Authentication Flow

- **Sign In**: `sign-in/page.tsx` → Auth callback → `auth/callback/page.tsx` → Redirect to admin
- **Admin Protection**: `middleware.ts` → `admin-check.tsx` → Redirect to `permission-denied/page.tsx` if needed

## Recent Improvements

### Security Center Simplification

We've simplified the Security Center to work without SQL checking and setup:

1. **Removed Setup Dependencies**: The Security Center no longer requires database setup checks
2. **Streamlined Interface**: Simplified the security client page to focus on dependency management
3. **Improved Error Handling**: Better error messages and diagnostic information
4. **Direct Dependency Scanning**: The system now directly scans dependencies without requiring table setup first
5. **Simplified Troubleshooting**: Added clearer troubleshooting steps for common issues

### Database Debugging Tools

We've added new tools to help diagnose database issues:

1. **Table Checking API**: Improved API for checking if tables exist
2. **Database Debug Page**: Added a debug page to view all tables and test table existence
3. **Direct Table Queries**: Added ability to check individual tables directly

### Analytics Integration

We've integrated Vercel Web Analytics to track site usage:

1. **Analytics Component**: Added the Analytics component to the root layout
2. **Automatic Page Tracking**: All page views are now automatically tracked
3. **Performance Monitoring**: Site performance metrics are now collected

## Dependency Management System

The dependency management system provides tools for tracking, updating, and securing project dependencies.

### Key Files:
- `/app/api/dependencies/route.ts` - Main API for dependency management
- `/app/api/dependencies/scan/route.ts` - API for scanning dependencies
- `/app/admin/security/client-page.tsx` - Security center UI with dependency management

### Features:
- **Dependency Scanning**: Automatically scan package.json for dependencies
- **Security Audits**: Check dependencies for known vulnerabilities
- **Update Management**: Control how dependencies are updated
- **Dashboard Widgets**: Customizable widgets for security monitoring

The dependency system now works without requiring explicit database setup, making it more reliable and user-friendly.
