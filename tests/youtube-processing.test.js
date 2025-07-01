/**
 * Test for YouTube URL Processing
 * 
 * This test validates that the YouTube URL processing works correctly
 * and doesn't cause the "y is not a function" error.
 */

const { extractVideoInfo, fetchYouTubeTitle } = require('../lib/project-data');

describe('YouTube URL Processing', () => {
  test('should extract video info from YouTube URLs', () => {
    const testCases = [
      {
        url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
        expected: { platform: 'youtube', id: 'dQw4w9WgXcQ' }
      },
      {
        url: 'https://youtu.be/dQw4w9WgXcQ',
        expected: { platform: 'youtube', id: 'dQw4w9WgXcQ' }
      },
      {
        url: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
        expected: { platform: 'youtube', id: 'dQw4w9WgXcQ' }
      }
    ];

    testCases.forEach(({ url, expected }) => {
      const result = extractVideoInfo(url);
      expect(result).toEqual(expected);
    });
  });

  test('should handle invalid URLs gracefully', () => {
    const invalidUrls = [
      'not-a-url',
      'https://example.com',
      '',
      null,
      undefined
    ];

    invalidUrls.forEach(url => {
      const result = extractVideoInfo(url);
      expect(result).toBeNull();
    });
  });

  test('should validate fetchYouTubeTitle function exists', () => {
    expect(typeof fetchYouTubeTitle).toBe('function');
  });
});