/**
 * Integration test for YouTube URL processing API
 * 
 * Tests the complete flow from frontend to API to ensure
 * the "application error" issue is resolved.
 */

// Mock environment variable for testing
process.env.YOUTUBE_API_KEY = 'test_api_key';

const { extractVideoInfo, extractVideoDate, fetchYouTubeTitle } = require('../lib/project-data');

describe('YouTube API Integration', () => {
  beforeEach(() => {
    // Reset any mocks
    global.fetch = jest.fn();
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  test('should extract video info correctly', () => {
    const testUrl = 'https://www.youtube.com/watch?v=dQw4w9WgXcQ';
    const result = extractVideoInfo(testUrl);
    
    expect(result).toEqual({
      platform: 'youtube',
      id: 'dQw4w9WgXcQ'
    });
  });

  test('should handle YouTube Data API response for date extraction', async () => {
    const mockResponse = {
      ok: true,
      json: async () => ({
        items: [{
          snippet: {
            publishedAt: '2023-01-01T10:00:00Z'
          }
        }]
      })
    };

    global.fetch = jest.fn().mockResolvedValue(mockResponse);

    const testUrl = 'https://www.youtube.com/watch?v=dQw4w9WgXcQ';
    const result = await extractVideoDate(testUrl);
    
    expect(result).toEqual(new Date('2023-01-01T10:00:00Z'));
    expect(global.fetch).toHaveBeenCalledWith(
      'https://www.googleapis.com/youtube/v3/videos?id=dQw4w9WgXcQ&part=snippet&key=test_api_key'
    );
  });

  test('should handle YouTube oEmbed API response for title extraction', async () => {
    const mockResponse = {
      ok: true,
      json: async () => ({
        title: 'Test Video Title'
      })
    };

    global.fetch = jest.fn().mockResolvedValue(mockResponse);

    const result = await fetchYouTubeTitle('dQw4w9WgXcQ');
    
    expect(result).toBe('Test Video Title');
    expect(global.fetch).toHaveBeenCalledWith(
      'https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=dQw4w9WgXcQ&format=json'
    );
  });

  test('should handle API errors gracefully', async () => {
    const mockResponse = {
      ok: false,
      status: 404,
      statusText: 'Not Found'
    };

    global.fetch = jest.fn().mockResolvedValue(mockResponse);

    const result = await fetchYouTubeTitle('invalid_id');
    
    expect(result).toBeNull();
  });

  test('should handle network errors gracefully', async () => {
    global.fetch = jest.fn().mockRejectedValue(new Error('Network error'));

    const result = await fetchYouTubeTitle('dQw4w9WgXcQ');
    
    expect(result).toBeNull();
  });

  test('should handle missing API key for date extraction', async () => {
    // Temporarily remove API key
    const originalApiKey = process.env.YOUTUBE_API_KEY;
    delete process.env.YOUTUBE_API_KEY;

    const testUrl = 'https://www.youtube.com/watch?v=dQw4w9WgXcQ';
    const result = await extractVideoDate(testUrl);
    
    expect(result).toBeNull();
    
    // Restore API key
    process.env.YOUTUBE_API_KEY = originalApiKey;
  });
});