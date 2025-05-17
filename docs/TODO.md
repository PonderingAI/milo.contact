# Portfolio Project TODO List

## Database Setup

- [ ] Add proper error handling and recovery for database setup
- [ ] Create a database migration system for future updates

## Dependency Management

- [ ] Implement dependency tracking system as suggested:
 - [ ] Detect unused/missing/outdated deps using tools like depcheck or npm-check
 - [ ] Expose project dependencies via Express JSON endpoint
 - [ ] Watch package.json (or npm ls --json) for changes using Chokidar
 - [ ] Push updates to browser in real-time with Server-Sent Events

## Storage Buckets

The following storage buckets need to be created in Supabase:

- [ ] `project-images` - For storing project thumbnail and gallery images
- [ ] `site-assets` - For storing site-wide assets like logos and icons
- [ ] `bts-images` - For storing behind-the-scenes images
- [ ] `media` - For storing general media files
- [ ] `icons` - For storing app icons and favicons

## Security Enhancements

- [ ] Implement more granular Row Level Security policies
- [ ] Add proper authentication checks for all API routes
- [ ] Create a comprehensive security audit system

## User Management

- [ ] Create a proper user onboarding flow
- [ ] Implement user role management UI
- [ ] Add email verification for new users

## Content Management

- [ ] Create a better content editor for projects
- [ ] Add support for rich text content
- [ ] Implement media library management

## Performance Optimizations

- [ ] Implement proper caching for database queries
- [ ] Add image optimization for uploaded images
- [ ] Implement lazy loading for images and content

## Analytics

- [ ] Add analytics tracking
- [ ] Create a dashboard for viewing site statistics
- [ ] Implement event tracking for user interactions

## Deployment

- [ ] Create a CI/CD pipeline for automated deployments
- [ ] Add environment-specific configuration
- [ ] Implement proper logging and monitoring

## Media System Issues

### Video System Issues

- [ ] **Fix video field name mismatch**: Update code to use `thumbnail_url` instead of `video_url`
  - [ ] Fix in `HeroSection` component
  - [ ] Fix in `ProjectDetailContent` component
  - [ ] Fix in `getProjectById` function in `lib/project-data.ts`

- [ ] **Improve video URL extraction**:
  - [ ] Add better error handling to `extractVideoInfo`
  - [ ] Add support for more URL formats
  - [ ] Add logging to track extraction failures

### BTS Image System Issues

- [ ] **Fix data structure mismatch**: The root cause of BTS images not displaying
  - [ ] Debug the `getProjectById` function to see what it's actually returning for `bts_images`
  - [ ] Add console logging in `ProjectDetailContent` to inspect the received `project.bts_images`
  - [ ] Ensure the data structure matches what the component expects

- [ ] **Fix BTS image API route**: Current implementation has limitations
  - [ ] Update the API route to handle individual captions for each image
  - [ ] Add better validation for the incoming data
  - [ ] Improve error handling and provide more detailed error messages

- [ ] **Enhance BTS image display**:
  - [ ] Add error boundaries around the BTS image gallery
  - [ ] Implement better fallbacks when images fail to load
  - [ ] Add loading states for BTS images

### Documentation and Testing

- [ ] **Create comprehensive documentation**:
  - [ ] Document the video system architecture
  - [ ] Document the BTS image system architecture
  - [ ] Create user guide for adding videos and BTS images to projects

- [ ] **Implement testing**:
  - [ ] Add tests for the video URL extraction function
  - [ ] Add tests for the BTS image API routes
  - [ ] Add integration tests for the project detail page

## Database Schema Improvements

- [ ] **Field name standardization**:
  - [ ] Consider renaming `thumbnail_url` to `video_url` for clarity
  - [ ] Consider adding dedicated fields for `video_platform` and `video_id`
  - [ ] Review the `bts_images` table schema for potential improvements

## UI Improvements

- [ ] **Error handling and user feedback**:
  - [ ] Add better error states when videos or images fail to load
  - [ ] Improve video player controls and appearance
  - [ ] Enhance the BTS image gallery with filtering and sorting options

## Feature Enhancements

- [ ] **Media capabilities**:
  - [ ] Add support for more video platforms
  - [ ] Add video analytics tracking
  - [ ] Implement video optimization for different devices
  - [ ] Add bulk upload for BTS images
  - [ ] Implement drag-and-drop reordering for BTS images
