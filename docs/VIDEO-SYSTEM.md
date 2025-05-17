# Video System Documentation

## Overview

This document explains how the video system works in the portfolio website, including how videos are stored, processed, and displayed.

## Database Schema

The project database schema includes these relevant fields for videos:

- `id` - Project identifier
- `thumbnail_url` - Field used to store video URLs (despite the name suggesting it's for thumbnails)
- No dedicated `video_platform` or `video_id` fields - these are extracted at runtime

## Video Flow

### 1. Project Creation/Editing

When a user adds a video to a project:

1. The video URL (YouTube, Vimeo, etc.) is saved in the `thumbnail_url` field
2. There is no pre-processing to extract and store the video platform or ID

### 2. Data Retrieval

When project data is retrieved:

1. The system should extract video information from `thumbnail_url` using the `extractVideoInfo` function
2. This function parses the URL to determine the platform (YouTube, Vimeo) and the video ID
3. The extraction happens at runtime, not during storage

### 3. Video Display

For displaying videos:

1. The system checks if video information is available
2. If valid platform and ID are extracted, the video player is shown
3. If extraction fails, the system falls back to displaying an image

## Current Issues

### Field Name Mismatch

The primary issue is a field name mismatch:

1. Video URLs are stored in `thumbnail_url`
2. But the code in multiple places looks for `video_url`:
   - In the `HeroSection` component
   - In the `ProjectDetailContent` component
   - In the `getProjectById` function

This mismatch causes the video extraction to fail, resulting in videos not being displayed.

### Affected Components

1. **Hero Section**: Fails to display the latest project's video
2. **Project Detail Pages**: Fails to display videos on individual project pages

## URL Format Support

The `extractVideoInfo` function supports these URL formats:

### YouTube
- `https://www.youtube.com/watch?v=VIDEO_ID`
- `https://www.youtube.com/embed/VIDEO_ID`
- `https://youtu.be/VIDEO_ID`

### Vimeo
- `https://vimeo.com/VIDEO_ID`
- `https://player.vimeo.com/video/VIDEO_ID`

### LinkedIn
- `https://www.linkedin.com/feed/update/urn:li:activity:ACTIVITY_ID`
- `https://www.linkedin.com/posts/PROFILE_ID-POST_ID`

## Troubleshooting

If videos aren't displaying:

1. Check that the video URL is stored in `thumbnail_url`
2. Verify the URL format is supported by `extractVideoInfo`
3. Update code to look for `thumbnail_url` instead of `video_url`
4. Add logging to debug extraction issues

## Recommended Fixes

1. Update all components to check for `thumbnail_url` instead of `video_url`
2. Consider renaming the database field for clarity in future updates
3. Add validation during project creation to ensure video URLs are valid
