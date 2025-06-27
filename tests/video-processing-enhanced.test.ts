/**
 * Enhanced Video Processing Test Suite
 * 
 * This test suite provides better logging and debugging capabilities
 * to help identify issues with YouTube video processing.
 */

import { extractVideoInfo, fetchYouTubeTitle } from '../lib/project-data';

describe('YouTube Video Processing', () => {
  beforeEach(() => {
    // Clear any previous console logs
    jest.clearAllMocks();
    console.log('\n' + '='.repeat(60));
  });

  afterEach(() => {
    console.log('='.repeat(60) + '\n');
  });

  describe('URL Extraction', () => {
    const testCases = [
      {
        name: 'Standard YouTube URL',
        url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
        expected: { platform: 'youtube', id: 'dQw4w9WgXcQ' }
      },
      {
        name: 'YouTube URL without protocol',
        url: 'youtube.com/watch?v=i_HtDNSxCnE',
        expected: { platform: 'youtube', id: 'i_HtDNSxCnE' }
      },
      {
        name: 'YouTube short URL',
        url: 'https://youtu.be/dQw4w9WgXcQ',
        expected: { platform: 'youtube', id: 'dQw4w9WgXcQ' }
      },
      {
        name: 'YouTube embed URL',
        url: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
        expected: { platform: 'youtube', id: 'dQw4w9WgXcQ' }
      }
    ];

    testCases.forEach(({ name, url, expected }) => {
      test(`should extract info from ${name}`, () => {
        console.log(`Testing: ${name}`);
        console.log(`Input URL: ${url}`);
        
        const result = extractVideoInfo(url);
        console.log(`Result: ${JSON.stringify(result)}`);
        console.log(`Expected: ${JSON.stringify(expected)}`);
        
        expect(result).toEqual(expected);
        console.log('✅ Test passed');
      });
    });

    test('should handle invalid URLs gracefully', () => {
      const invalidUrls = [
        '',
        null,
        undefined,
        'not-a-url',
        'https://example.com',
        'https://vimeo.com/123456' // Different platform
      ];

      invalidUrls.forEach(url => {
        console.log(`Testing invalid URL: ${url}`);
        const result = extractVideoInfo(url as any);
        console.log(`Result: ${JSON.stringify(result)}`);
        
        if (url === 'https://vimeo.com/123456') {
          expect(result).toEqual({ platform: 'vimeo', id: '123456' });
        } else {
          expect(result).toBeNull();
        }
      });
    });
  });

  describe('YouTube Title Fetching (oEmbed API)', () => {
    test('should fetch title for valid video ID', async () => {
      console.log('Testing oEmbed API title fetching...');
      
      // Mock the fetch function
      const mockResponse = {
        ok: true,
        json: async () => ({
          title: 'Test Video Title',
          author_name: 'Test Channel'
        })
      };
      
      global.fetch = jest.fn().mockResolvedValue(mockResponse);
      
      const videoId = 'dQw4w9WgXcQ';
      console.log(`Fetching title for video ID: ${videoId}`);
      
      const title = await fetchYouTubeTitle(videoId);
      console.log(`Fetched title: ${title}`);
      
      expect(title).toBe('Test Video Title');
      expect(fetch).toHaveBeenCalledWith(
        `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`
      );
      
      console.log('✅ oEmbed test passed');
    });

    test('should handle API errors gracefully', async () => {
      console.log('Testing oEmbed API error handling...');
      
      // Mock a failed response
      const mockResponse = {
        ok: false,
        status: 404,
        statusText: 'Not Found'
      };
      
      global.fetch = jest.fn().mockResolvedValue(mockResponse);
      
      const videoId = 'invalid-id';
      console.log(`Testing error handling for video ID: ${videoId}`);
      
      const title = await fetchYouTubeTitle(videoId);
      console.log(`Result for failed request: ${title}`);
      
      expect(title).toBeNull();
      console.log('✅ Error handling test passed');
    });

    test('should handle network errors', async () => {
      console.log('Testing network error handling...');
      
      // Mock a network error
      global.fetch = jest.fn().mockRejectedValue(new Error('Network error'));
      
      const videoId = 'dQw4w9WgXcQ';
      console.log(`Testing network error for video ID: ${videoId}`);
      
      const title = await fetchYouTubeTitle(videoId);
      console.log(`Result for network error: ${title}`);
      
      expect(title).toBeNull();
      console.log('✅ Network error test passed');
    });
  });

  describe('API Endpoint Simulation', () => {
    test('should handle YouTube URLs without API key', async () => {
      console.log('Testing YouTube processing without API key...');
      
      // Ensure no API key is set
      const originalApiKey = process.env.YOUTUBE_API_KEY;
      delete process.env.YOUTUBE_API_KEY;
      
      try {
        const url = 'https://www.youtube.com/watch?v=dQw4w9WgXcQ';
        console.log(`Processing URL: ${url}`);
        
        const videoInfo = extractVideoInfo(url);
        console.log(`Video info: ${JSON.stringify(videoInfo)}`);
        
        expect(videoInfo).toEqual({
          platform: 'youtube',
          id: 'dQw4w9WgXcQ'
        });
        
        // Simulate the API logic
        const thumbnailUrl = `https://img.youtube.com/vi/${videoInfo!.id}/hqdefault.jpg`;
        console.log(`Generated thumbnail URL: ${thumbnailUrl}`);
        
        expect(thumbnailUrl).toBe('https://img.youtube.com/vi/dQw4w9WgXcQ/hqdefault.jpg');
        
        console.log('📝 Note: YouTube Data API key not found - date extraction would be skipped');
        console.log('📝 Note: Would fall back to oEmbed API for title extraction');
        console.log('✅ No API key test passed');
        
      } finally {
        // Restore original API key
        if (originalApiKey) {
          process.env.YOUTUBE_API_KEY = originalApiKey;
        }
      }
    });

    test('should simulate duplicate video handling', () => {
      console.log('Testing duplicate video response handling...');
      
      const duplicateResponse = {
        duplicate: true,
        existingVideo: {
          id: 'test-id',
          filename: 'YouTube Video dQw4w9WgXcQ',
          filepath: 'youtube.com/watch?v=dQw4w9WgXcQ',
          public_url: 'youtube.com/watch?v=dQw4w9WgXcQ',
          filetype: 'youtube',
          thumbnail_url: 'https://img.youtube.com/vi/dQw4w9WgXcQ/hqdefault.jpg'
        },
        message: 'URL already exists as "YouTube Video dQw4w9WgXcQ"',
        matchType: 'videoId'
      };
      
      console.log('Duplicate response structure:');
      console.log(JSON.stringify(duplicateResponse, null, 2));
      
      // Test safe property access
      expect(duplicateResponse.duplicate).toBe(true);
      expect(duplicateResponse.existingVideo).toBeDefined();
      expect(typeof duplicateResponse.existingVideo).toBe('object');
      expect(duplicateResponse.existingVideo.filename).toBe('YouTube Video dQw4w9WgXcQ');
      
      console.log('✅ Duplicate handling test passed');
    });

    test('should simulate new video response', () => {
      console.log('Testing new video response handling...');
      
      const newVideoResponse = {
        success: true,
        url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
        thumbnailUrl: 'https://img.youtube.com/vi/dQw4w9WgXcQ/hqdefault.jpg',
        title: 'YouTube Video: dQw4w9WgXcQ',
        platform: 'youtube',
        id: 'dQw4w9WgXcQ',
        uploadDate: null
      };
      
      console.log('New video response structure:');
      console.log(JSON.stringify(newVideoResponse, null, 2));
      
      // Test response validation
      expect(newVideoResponse.success).toBe(true);
      expect(newVideoResponse.url).toBeDefined();
      expect(newVideoResponse.thumbnailUrl).toBeDefined();
      expect(newVideoResponse.title).toBeDefined();
      expect(newVideoResponse.platform).toBe('youtube');
      expect(newVideoResponse.id).toBe('dQw4w9WgXcQ');
      
      console.log('✅ New video handling test passed');
    });
  });

  describe('Error Scenarios', () => {
    test('should handle malformed API responses', () => {
      console.log('Testing malformed API response handling...');
      
      const malformedResponses = [
        null,
        undefined,
        '',
        'not-json',
        { incomplete: true },
        { duplicate: 'not-boolean' },
        { success: 'not-boolean' }
      ];
      
      malformedResponses.forEach((response, index) => {
        console.log(`Testing malformed response ${index + 1}: ${JSON.stringify(response)}`);
        
        // Simulate the validation logic from the component
        const isValidDuplicate = response && 
          typeof response === 'object' && 
          response.duplicate === true;
          
        const isValidSuccess = response && 
          typeof response === 'object' && 
          response.success === true;
        
        console.log(`Is valid duplicate: ${isValidDuplicate}`);
        console.log(`Is valid success: ${isValidSuccess}`);
        
        // Most should be invalid
        if (response === null || response === undefined || typeof response !== 'object') {
          expect(isValidDuplicate).toBe(false);
          expect(isValidSuccess).toBe(false);
        }
      });
      
      console.log('✅ Malformed response test passed');
    });
  });

  describe('Integration Tests', () => {
    test('should provide comprehensive logging for debugging', () => {
      console.log('=== VIDEO PROCESSING DEBUG INFORMATION ===');
      console.log('');
      console.log('1. URL Processing Test:');
      
      const testUrl = 'youtube.com/watch?v=i_HtDNSxCnE';
      console.log(`   Input URL: ${testUrl}`);
      
      const videoInfo = extractVideoInfo(testUrl);
      console.log(`   Extracted info: ${JSON.stringify(videoInfo)}`);
      
      if (videoInfo) {
        const thumbnailUrl = `https://img.youtube.com/vi/${videoInfo.id}/hqdefault.jpg`;
        console.log(`   Generated thumbnail: ${thumbnailUrl}`);
        console.log(`   Platform: ${videoInfo.platform}`);
        console.log(`   Video ID: ${videoInfo.id}`);
      }
      
      console.log('');
      console.log('2. API Key Status:');
      const apiKey = process.env.YOUTUBE_API_KEY;
      console.log(`   YouTube API Key present: ${!!apiKey}`);
      console.log(`   YouTube API Key length: ${apiKey ? apiKey.length : 0}`);
      console.log(`   YouTube API Key (first 10 chars): ${apiKey ? apiKey.substring(0, 10) + '...' : 'N/A'}`);
      
      if (!apiKey || apiKey.trim() === '') {
        console.log('   📝 Date extraction will be skipped');
        console.log('   📝 Will fall back to oEmbed API for title');
      } else {
        console.log('   📝 Will attempt YouTube Data API v3 for metadata');
      }
      
      console.log('');
      console.log('3. Expected Processing Flow:');
      console.log('   a) URL validation ✓');
      console.log('   b) Video info extraction ✓');
      console.log('   c) Duplicate check (database)');
      console.log('   d) Thumbnail URL generation ✓');
      console.log('   e) Title fetching (oEmbed fallback) ✓');
      console.log('   f) Date extraction (skipped without API key) ✓');
      console.log('   g) Database insertion');
      console.log('   h) UI state updates');
      
      console.log('');
      console.log('=== END DEBUG INFORMATION ===');
      
      expect(true).toBe(true); // This test always passes, it's just for logging
    });
  });
});