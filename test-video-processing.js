#!/usr/bin/env node

/**
 * Simple test script to verify video processing API
 */

// Inline video info extraction function for testing
function extractVideoInfo(url) {
  try {
    if (!url || typeof url !== "string") {
      console.error("Invalid video URL:", url)
      return null
    }

    // YouTube URL patterns
    const youtubePatterns = [
      /(?:https?:\/\/)?(?:www\.)?youtube\.com\/watch\?v=([^&]+)/i,
      /(?:https?:\/\/)?(?:www\.)?youtube\.com\/embed\/([^?]+)/i,
      /(?:https?:\/\/)?(?:www\.)?youtu\.be\/([^?]+)/i,
    ]

    // Check YouTube patterns
    for (const pattern of youtubePatterns) {
      const match = url.match(pattern)
      if (match && match[1]) {
        return { platform: "youtube", id: match[1] }
      }
    }

    console.warn("Unrecognized video URL format:", url)
    return null
  } catch (error) {
    console.error("Error extracting video info:", error)
    return null
  }
}

console.log('=== Video Processing Test ===');

// Test URLs
const testUrls = [
  'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
  'youtube.com/watch?v=i_HtDNSxCnE',
  'https://youtu.be/dQw4w9WgXcQ'
];

console.log('\n1. Testing URL extraction:');
testUrls.forEach(url => {
  console.log(`URL: ${url}`);
  try {
    const info = extractVideoInfo(url);
    console.log(`  Result: ${JSON.stringify(info)}`);
  } catch (error) {
    console.log(`  Error: ${error.message}`);
  }
  console.log('');
});

console.log('\n2. Testing API endpoint simulation:');

// Simulate the API call locally (without actually hitting the database)
async function testApiLogic(url) {
  console.log(`\nTesting URL: ${url}`);
  console.log("Step 1: URL validation");
  
  if (!url || typeof url !== 'string' || url.trim() === '') {
    console.log("  ❌ Invalid URL provided");
    return { error: "No valid URL provided" };
  }
  
  const trimmedUrl = url.trim();
  console.log(`  ✅ URL trimmed: ${trimmedUrl}`);
  
  console.log("Step 2: Video info extraction");
  const videoInfo = extractVideoInfo(trimmedUrl);
  
  if (!videoInfo) {
    console.log("  ❌ Invalid video URL format");
    return { error: "Invalid video URL format" };
  }
  
  console.log(`  ✅ Video info: ${JSON.stringify(videoInfo)}`);
  
  console.log("Step 3: Simulate processing logic");
  
  let thumbnailUrl = null;
  let videoTitle = null;
  let uploadDate = null;
  
  if (videoInfo.platform === "youtube") {
    console.log("  Processing YouTube video");
    thumbnailUrl = `https://img.youtube.com/vi/${videoInfo.id}/hqdefault.jpg`;
    
    // Simulate no API key scenario
    const apiKey = process.env.YOUTUBE_API_KEY;
    if (!apiKey || apiKey.trim() === '') {
      console.log("  📝 YouTube Data API key not found - falling back to oEmbed");
      videoTitle = `YouTube Video: ${videoInfo.id}`;
      console.log("  📝 Date extraction will be skipped for this video");
    } else {
      console.log("  📝 YouTube Data API key found - would attempt full metadata fetch");
      videoTitle = `YouTube Video: ${videoInfo.id}`;
    }
  }
  
  console.log("Step 4: Final result");
  const result = {
    success: true,
    url: trimmedUrl,
    thumbnailUrl,
    title: videoTitle,
    platform: videoInfo.platform,
    id: videoInfo.id,
    uploadDate,
  };
  
  console.log(`  ✅ Result: ${JSON.stringify(result, null, 2)}`);
  return result;
}

// Test each URL
async function runTests() {
  for (const url of testUrls) {
    await testApiLogic(url);
  }
}

runTests().catch(console.error);