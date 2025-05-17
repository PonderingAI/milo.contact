# Project Creation & BTS Images Issues

## Problem Description

When creating a new project, the Behind-The-Scenes (BTS) images are not being properly saved. The user is redirected to the projects list page immediately after project creation, but the BTS images saving process may not have completed or may have failed silently.

## Root Causes

1. **Asynchronous Timing Issue**: 
   - The form submission redirects immediately after project creation
   - BTS image saving happens asynchronously but doesn't block the redirect
   - The user is redirected before BTS images are fully processed

2. **Error Handling Gaps**:
   - Errors in BTS image saving are logged but not shown to the user
   - No feedback is provided about the success or failure of BTS image saving
   - Silent failures lead to confusion when BTS images don't appear

3. **Database Schema Issues**:
   - The BTS images table might not be properly set up
   - No distinction between BTS images and videos in the database
   - Inconsistent handling between create and edit modes

## Technical Analysis

### Project Creation Flow

1. User fills out project form and adds BTS images
2. Form is submitted via `handleSubmit` function
3. Project data is sent to `/api/projects/create` endpoint
4. After successful project creation, the code attempts to save BTS images
5. User is redirected to projects list regardless of BTS image saving status

### BTS Image Saving Process

Current implementation has these issues:
- No waiting for BTS image saving to complete before redirect
- No proper error handling for BTS image saving failures
- No user feedback about BTS image saving status
- Inconsistent behavior between create and edit modes

## Recommended Fixes

1. **Improve Asynchronous Flow**:
   - Wait for BTS image saving to complete before redirecting
   - Use Promise.all to handle multiple BTS image uploads in parallel
   - Add proper loading state during BTS image saving

2. **Add Error Handling**:
   - Catch and display errors during BTS image saving
   - Provide user feedback via toast notifications
   - Log detailed errors for debugging

3. **Update Database Schema**:
   - Ensure BTS images table is properly set up
   - Add field to distinguish between images and videos
   - Make behavior consistent between create and edit modes

4. **Improve User Experience**:
   - Add loading indicators during BTS image saving
   - Provide success/error notifications
   - Allow retry for failed BTS image uploads
