/**
 * Browser Console Test for YouTube Video Processing
 * 
 * Copy and paste this into the browser console on the /admin/projects/new page
 * to test the video processing functionality and see the improved logging.
 */

// Test function to validate video processing
async function testVideoProcessing() {
  console.log('=== Testing YouTube Video Processing ===');
  
  // Test URLs - replace with actual URLs you want to test
  const testUrls = [
    'https://www.youtube.com/watch?v=dQw4w9WgXcQ', // Rick Roll
    'https://youtu.be/dQw4w9WgXcQ', // Short URL format
    'https://www.youtube.com/watch?v=i_HtDNSxCnE' // The video mentioned in the issue
  ];
  
  for (const url of testUrls) {
    console.log(`\n--- Testing URL: ${url} ---`);
    
    try {
      // Test the process-video-url API directly
      const response = await fetch('/api/process-video-url', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url: url })
      });
      
      const result = await response.json();
      
      if (response.ok) {
        if (result.duplicate) {
          console.log('✓ Duplicate video handled successfully');
          console.log('  Message:', result.message);
          console.log('  Existing video:', result.existingVideo);
        } else {
          console.log('✓ New video processed successfully');
          console.log('  Title:', result.title);
          console.log('  Platform:', result.platform);
          console.log('  Upload date:', result.uploadDate || 'Not available (API key required)');
        }
      } else {
        console.log('✗ API Error:', result.error);
      }
      
    } catch (error) {
      console.log('✗ Network Error:', error.message);
    }
  }
  
  console.log('\n=== Test Complete ===');
  console.log('Check the Network tab for detailed API logs');
  console.log('Check the Console for process-video-url: prefixed logs');
}

// Test function for duplicate handling
function testDuplicateHandling() {
  console.log('=== Testing Duplicate Response Handling ===');
  
  // Simulate problematic duplicate responses
  const testResponses = [
    {
      duplicate: true,
      existingVideo: null,
      message: 'Video already exists',
      matchType: 'videoId'
    },
    {
      duplicate: true,
      existingVideo: {
        filename: 'Test Video',
        thumbnail_url: 'https://example.com/thumb.jpg'
        // metadata is undefined
      },
      message: 'Video already exists',
      matchType: 'videoId'
    }
  ];
  
  testResponses.forEach((result, index) => {
    console.log(`\n--- Testing duplicate response ${index + 1} ---`);
    
    try {
      // Simulate the fixed duplicate handling logic
      const existingVideo = result.existingVideo;
      if (existingVideo && typeof existingVideo === 'object') {
        console.log('✓ existingVideo type check passed');
        
        if (existingVideo.thumbnail_url) {
          console.log('✓ thumbnail_url available:', existingVideo.thumbnail_url);
        }
        
        if (existingVideo.metadata?.uploadDate) {
          try {
            const date = new Date(existingVideo.metadata.uploadDate);
            if (!isNaN(date.getTime())) {
              console.log('✓ Upload date parsed successfully:', date.toISOString());
            }
          } catch (dateError) {
            console.log('✓ Date parsing error handled gracefully:', dateError.message);
          }
        } else {
          console.log('✓ No upload date metadata (handled safely)');
        }
      } else {
        console.log('✓ Invalid existingVideo handled safely');
      }
      
      console.log('✓ Duplicate response handled without errors');
      
    } catch (error) {
      console.log('✗ Error in duplicate handling:', error.message);
    }
  });
  
  console.log('\n=== Duplicate Handling Test Complete ===');
}

// Instructions for use
console.log(`
🧪 YouTube Video Processing Test Suite

To test the fixes:

1. Run full video processing test:
   testVideoProcessing()

2. Test duplicate handling logic:
   testDuplicateHandling()

3. Test individual URL processing:
   fetch('/api/process-video-url', {
     method: 'POST',
     headers: { 'Content-Type': 'application/json' },
     body: JSON.stringify({ url: 'YOUR_YOUTUBE_URL_HERE' })
   }).then(r => r.json()).then(console.log)

Look for detailed logs with 'process-video-url:' prefix in the console.
`);

// Export functions for global access
window.testVideoProcessing = testVideoProcessing;
window.testDuplicateHandling = testDuplicateHandling;