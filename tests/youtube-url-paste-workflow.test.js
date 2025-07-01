/**
 * End-to-end test simulating the YouTube URL paste functionality
 * 
 * This test simulates the exact workflow that would trigger
 * the original "y is not a function" error.
 */

// Mock the fetch for the process-video-url API
global.fetch = jest.fn();

// Mock environment variables
process.env.YOUTUBE_API_KEY = 'test_api_key';

describe('YouTube URL Paste Workflow', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  test('should successfully process YouTube URL without errors', async () => {
    // Mock the API responses that would happen in the real workflow
    const mockYouTubeApiResponse = {
      ok: true,
      json: async () => ({
        items: [{
          snippet: {
            title: 'Rick Astley - Never Gonna Give You Up',
            publishedAt: '2009-10-25T07:38:33Z'
          }
        }]
      })
    };

    const mockProcessVideoApiResponse = {
      ok: true,
      json: async () => ({
        success: true,
        url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
        thumbnailUrl: 'https://img.youtube.com/vi/dQw4w9WgXcQ/hqdefault.jpg',
        title: 'Rick Astley - Never Gonna Give You Up',
        platform: 'youtube',
        id: 'dQw4w9WgXcQ',
        uploadDate: '2009-10-25T07:38:33.000Z'
      })
    };

    // Setup fetch mock to return different responses based on URL
    global.fetch = jest.fn().mockImplementation((url) => {
      if (url.includes('googleapis.com')) {
        return Promise.resolve(mockYouTubeApiResponse);
      } else if (url.includes('/api/process-video-url')) {
        return Promise.resolve(mockProcessVideoApiResponse);
      }
      return Promise.reject(new Error('Unexpected URL'));
    });

    // Simulate the workflow
    const testUrl = 'https://www.youtube.com/watch?v=dQw4w9WgXcQ';
    
    // 1. Test video info extraction (this should not throw)
    const { extractVideoInfo } = require('../lib/project-data');
    const videoInfo = extractVideoInfo(testUrl);
    
    expect(videoInfo).toEqual({
      platform: 'youtube',
      id: 'dQw4w9WgXcQ'
    });

    // 2. Test date extraction (this should not throw)
    const { extractVideoDate } = require('../lib/project-data');
    const videoDate = await extractVideoDate(testUrl);
    
    expect(videoDate).toEqual(new Date('2009-10-25T07:38:33Z'));

    // 3. Test title extraction (this should not throw)
    const { fetchYouTubeTitle } = require('../lib/project-data');
    
    // Since fetchYouTubeTitle uses oEmbed, we need to mock that too
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        title: 'Rick Astley - Never Gonna Give You Up'
      })
    });
    
    const title = await fetchYouTubeTitle('dQw4w9WgXcQ');
    expect(title).toBe('Rick Astley - Never Gonna Give You Up');

    // If we get here without throwing, the issue is fixed
    expect(true).toBe(true);
  });

  test('should handle the exact error scenario from the issue', async () => {
    // This test specifically checks that the functions don't throw
    // the "y is not a function" error that was reported
    
    const { extractVideoInfo } = require('../lib/project-data');
    
    // Test that these calls don't result in "y is not a function"
    expect(() => {
      const result = extractVideoInfo('https://www.youtube.com/watch?v=dQw4w9WgXcQ');
      expect(result).toBeDefined();
    }).not.toThrow();

    expect(() => {
      const result = extractVideoInfo('https://youtu.be/dQw4w9WgXcQ');
      expect(result).toBeDefined();
    }).not.toThrow();

    expect(() => {
      const result = extractVideoInfo('invalid-url');
      expect(result).toBeNull();
    }).not.toThrow();
  });
});