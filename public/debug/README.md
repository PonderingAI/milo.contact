# Debug Tools for YouTube Video Processing

This directory contains debugging tools to help test and validate the YouTube video processing fixes.

## Files

### `console-test.js`
Browser console test script for testing video processing functionality.

**Usage:**
1. Open the `/admin/projects/new` page
2. Open browser developer tools (F12)
3. Copy and paste the contents of `console-test.js` into the console
4. Run the test functions:
   - `testVideoProcessing()` - Tests the full video processing pipeline
   - `testDuplicateHandling()` - Tests duplicate response handling logic

### `../scripts/validate-video-processing.js`
Node.js validation script for testing core functionality.

**Usage:**
```bash
cd /path/to/project
node scripts/validate-video-processing.js
```

## What to Look For

### In Console Logs
- **process-video-url:** prefixed messages showing processing steps
- **YouTube Data API key** status messages
- **Database insertion** operation logs
- **Error handling** with specific contexts

### Expected Behavior

#### When YouTube API Key is Missing
```
process-video-url: YouTube Data API key not found or empty - falling back to oEmbed for title only
process-video-url: Date extraction will be skipped for this video
```

#### When API Key is Invalid
```
process-video-url: YouTube Data API failed: 403 Forbidden
process-video-url: YouTube API key may be invalid or quota exceeded
```

#### For Duplicate Videos
```
process-video-url: Duplicate video found
addMainVideoUrl: Video already exists, adding to interface
```

#### For New Videos
```
process-video-url: No duplicate found, proceeding with new video processing
process-video-url: Database insertion successful
```

## Testing Different Scenarios

### Test Duplicate Videos
1. Add a YouTube URL to a project
2. Try adding the same URL again
3. Should see duplicate handling logs and no JavaScript errors

### Test Missing API Key
1. Remove `YOUTUBE_API_KEY` from environment variables
2. Add a YouTube URL
3. Should see fallback messages and oEmbed title extraction

### Test Database Constraints
1. Add a new YouTube URL
2. Check that both `filepath` and `file_path` are populated in logs
3. Should see successful database insertion

## Common Issues and Solutions

### "y is not a function" Error
- **Fixed:** Added defensive programming for `existingVideo` object access
- **Check:** Look for proper type checking in duplicate handling

### "null value in column 'filepath'" Error  
- **Fixed:** Ensured both `filepath` and `file_path` are populated
- **Check:** Look for trimmed URL being used consistently

### Missing Date Extraction
- **Expected:** When no YouTube API key is configured
- **Check:** Look for API key status messages in console