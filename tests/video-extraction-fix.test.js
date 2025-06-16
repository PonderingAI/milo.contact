/**
 * Test to verify that the video extraction fix works correctly
 * This test validates the fix for issue #56 - landing page video fails to load
 */

// Import the fixed extractVideoInfo function (the one now used by VideoBackground)
const extractVideoInfo = require('../lib/project-data').extractVideoInfo;

describe('Video Extraction Fix for Issue #56', () => {
  test('extractVideoInfo should extract YouTube video information correctly', () => {
    const youtubeUrl = 'https://www.youtube.com/watch?v=dQw4w9WgXcQ';
    const result = extractVideoInfo(youtubeUrl);
    
    expect(result).not.toBeNull();
    expect(result.platform).toBe('youtube');
    expect(result.id).toBe('dQw4w9WgXcQ');
  });

  test('extractVideoInfo should extract YouTube short URL information correctly', () => {
    const youtubeShortUrl = 'https://youtu.be/dQw4w9WgXcQ';
    const result = extractVideoInfo(youtubeShortUrl);
    
    expect(result).not.toBeNull();
    expect(result.platform).toBe('youtube');
    expect(result.id).toBe('dQw4w9WgXcQ');
  });

  test('extractVideoInfo should extract Vimeo video information correctly', () => {
    const vimeoUrl = 'https://vimeo.com/123456789';
    const result = extractVideoInfo(vimeoUrl);
    
    expect(result).not.toBeNull();
    expect(result.platform).toBe('vimeo');
    expect(result.id).toBe('123456789');
  });

  test('extractVideoInfo should extract Vimeo player URL information correctly', () => {
    const vimeoPlayerUrl = 'https://player.vimeo.com/video/123456789';
    const result = extractVideoInfo(vimeoPlayerUrl);
    
    expect(result).not.toBeNull();
    expect(result.platform).toBe('vimeo');
    expect(result.id).toBe('123456789');
  });

  test('extractVideoInfo should return null for invalid URLs', () => {
    const invalidUrl = 'https://example.com/not-a-video';
    const result = extractVideoInfo(invalidUrl);
    
    expect(result).toBeNull();
  });

  test('extractVideoInfo should return null for empty or invalid input', () => {
    expect(extractVideoInfo('')).toBeNull();
    expect(extractVideoInfo(null)).toBeNull();
    expect(extractVideoInfo(undefined)).toBeNull();
  });
});

// Test the video background component logic (simplified simulation)
describe('VideoBackground Component Fix Validation', () => {
  test('VideoBackground should be able to extract video info from thumbnail_url', () => {
    // Simulate a project with thumbnail_url (as used in the hero section)
    const mockProject = {
      title: 'Test Project',
      thumbnail_url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ'
    };

    // This is what VideoBackground does when it receives a video URL
    const videoInfo = extractVideoInfo(mockProject.thumbnail_url);
    
    // Should successfully extract video info (this was failing before the fix)
    expect(videoInfo).not.toBeNull();
    expect(videoInfo.platform).toBe('youtube');
    expect(videoInfo.id).toBe('dQw4w9WgXcQ');
    
    // Should be able to determine it's a video (this logic is in video-background.tsx)
    const isVideo = !!(videoInfo && videoInfo.platform && videoInfo.id);
    expect(isVideo).toBe(true);
  });
});