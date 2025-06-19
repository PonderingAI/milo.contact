# Video Date Extraction Implementation

This document explains the video date extraction functionality implemented for the project creation and editing system.

## Overview

The system can extract release dates from video URLs and automatically populate the project date field. It also displays release dates in tooltips when hovering over videos in the project editor.

## Supported Platforms

### ✅ Vimeo (Fully Supported)
- **API Used**: Vimeo API v2 (public, no authentication required)
- **Endpoint**: `https://vimeo.com/api/v2/video/{video_id}.json`
- **Date Field**: `upload_date`
- **Status**: Working and tested

### ⚠️ YouTube (Partial Support)
- **Current Status**: Placeholder implementation
- **Required**: YouTube Data API v3 with API key
- **Endpoint**: `https://www.googleapis.com/youtube/v3/videos`
- **Date Field**: `snippet.publishedAt`
- **Status**: Ready for API key integration

## Implementation Details

### Core Functions

1. **`extractVideoDate(url: string)`** in `lib/project-data.ts`
   - Main function for extracting video release dates
   - Handles both YouTube and Vimeo URLs
   - Returns `Date | null`

2. **`extractDateFromMedia(url: string, type: "image" | "video")`** in `components/admin/project-editor.tsx`
   - Wrapper function that calls `extractVideoDate` for videos
   - Also handles image metadata extraction

3. **`processExternalVideo(mediaUrl: string)`** in `components/admin/project-editor.tsx`
   - Processes external video URLs during project creation
   - Automatically fills project date if empty

### UI Components

1. **`VideoDisplayWithTooltip`** component
   - Shows video thumbnails with release date tooltips
   - Handles both main videos and BTS videos
   - Provides different messages for YouTube vs Vimeo

## Auto-fill Behavior

When adding videos during project creation:
1. System extracts video information and release date
2. If project date field is empty, it's auto-filled with the video release date
3. User sees a toast notification about the processing
4. For YouTube videos, date extraction is skipped (until API integration)

## Tooltip Display

When hovering over videos in the project editor:
- **Vimeo**: Shows actual release date if available
- **YouTube**: Shows "Release date requires YouTube Data API"
- **Other videos**: Shows "Release date not available"

## YouTube Data API Integration

To enable YouTube date extraction, follow these steps:

### 1. Get YouTube Data API Key
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable YouTube Data API v3
4. Create credentials (API key)
5. Restrict the API key to YouTube Data API v3

### 2. Add Environment Variable
```bash
# Add to .env.local
YOUTUBE_API_KEY=your_api_key_here
```

### 3. Update the Implementation
```typescript
// In lib/project-data.ts, replace the YouTube section:
if (videoInfo.platform === "youtube") {
  const apiKey = process.env.YOUTUBE_API_KEY
  if (!apiKey) {
    console.warn("YouTube API key not configured")
    return null
  }
  
  const response = await fetch(
    `https://www.googleapis.com/youtube/v3/videos?id=${videoInfo.id}&part=snippet&key=${apiKey}`
  )
  
  if (response.ok) {
    const data = await response.json()
    if (data.items && data.items.length > 0) {
      const publishedAt = data.items[0].snippet.publishedAt
      if (publishedAt) {
        return new Date(publishedAt)
      }
    }
  }
}
```

### 4. Handle Rate Limits
- YouTube Data API has quota limits
- Implement caching to reduce API calls
- Consider storing extracted dates in the database

## Testing

Run the test suite to verify functionality:
```bash
npm test tests/video-date-extraction.test.js
```

## Error Handling

- Network errors are gracefully handled
- Invalid video URLs return `null`
- API failures don't break the user experience
- Console logging for debugging

## Future Enhancements

1. **YouTube Data API Integration**: As described above
2. **Date Caching**: Store extracted dates in database to avoid repeated API calls
3. **Additional Platforms**: Support for other video platforms
4. **Batch Processing**: Extract dates for multiple videos simultaneously
5. **Manual Override**: Allow users to manually set video release dates