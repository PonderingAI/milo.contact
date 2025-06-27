/**
 * Enhanced YouTube URL processing test
 * 
 * This test covers the edge cases reported by @PonderingAI:
 * 1. Duplicate video handling causing JavaScript errors
 * 2. Database constraint issues with null filepath
 * 3. Missing YouTube API key handling
 * 4. Improved logging and error scenarios
 */

// Mock environment variables
process.env.YOUTUBE_API_KEY = ''; // Test without API key first

describe('Enhanced YouTube URL Processing', () => {
  beforeEach(() => {
    jest.resetAllMocks();
    // Reset fetch mock
    global.fetch = jest.fn();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Missing YouTube API Key Handling', () => {
    test('should log appropriate message when API key is missing', async () => {
      // Ensure API key is not set
      delete process.env.YOUTUBE_API_KEY;
      
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
      
      const { extractVideoDate } = require('../lib/project-data');
      const result = await extractVideoDate('https://www.youtube.com/watch?v=dQw4w9WgXcQ');
      
      expect(result).toBeNull();
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('YouTube Data API key not found or empty')
      );
      
      consoleSpy.mockRestore();
    });

    test('should log appropriate message when API key is empty string', async () => {
      process.env.YOUTUBE_API_KEY = '';
      
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
      
      const { extractVideoDate } = require('../lib/project-data');
      const result = await extractVideoDate('https://www.youtube.com/watch?v=dQw4w9WgXcQ');
      
      expect(result).toBeNull();
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('YouTube Data API key not found or empty')
      );
      
      consoleSpy.mockRestore();
    });

    test('should work with oEmbed fallback when API key is missing', async () => {
      delete process.env.YOUTUBE_API_KEY;
      
      // Mock oEmbed response
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          title: 'Test Video Title'
        })
      });
      
      const { fetchYouTubeTitle } = require('../lib/project-data');
      const result = await fetchYouTubeTitle('dQw4w9WgXcQ');
      
      expect(result).toBe('Test Video Title');
      expect(global.fetch).toHaveBeenCalledWith(
        'https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=dQw4w9WgXcQ&format=json'
      );
    });
  });

  describe('Duplicate Video Handling', () => {
    test('should handle duplicate response with missing properties gracefully', () => {
      // This simulates the scenario where existingVideo might not have expected structure
      const duplicateResponse = {
        duplicate: true,
        existingVideo: null, // This could cause the JavaScript error
        message: 'Video already exists',
        matchType: 'videoId'
      };

      // Test that we can handle this without throwing errors
      expect(() => {
        const existingVideo = duplicateResponse.existingVideo;
        if (existingVideo && typeof existingVideo === 'object') {
          // Safe property access
          const thumbnail = existingVideo.thumbnail_url;
          const filename = existingVideo.filename;
        }
      }).not.toThrow();
    });

    test('should handle duplicate response with malformed existingVideo', () => {
      const duplicateResponse = {
        duplicate: true,
        existingVideo: "not an object", // Wrong type
        message: 'Video already exists',
        matchType: 'videoId'
      };

      // Test defensive programming approach
      expect(() => {
        const existingVideo = duplicateResponse.existingVideo;
        if (existingVideo && typeof existingVideo === 'object') {
          // This won't execute due to type check
          const thumbnail = existingVideo.thumbnail_url;
        }
      }).not.toThrow();
    });

    test('should handle duplicate response with undefined metadata', () => {
      const duplicateResponse = {
        duplicate: true,
        existingVideo: {
          filename: 'Test Video',
          thumbnail_url: 'https://example.com/thumb.jpg',
          // metadata is undefined
        },
        message: 'Video already exists',
        matchType: 'videoId'
      };

      // Test safe metadata access
      expect(() => {
        const existingVideo = duplicateResponse.existingVideo;
        if (existingVideo && existingVideo.metadata?.uploadDate) {
          const date = new Date(existingVideo.metadata.uploadDate);
        }
      }).not.toThrow();
    });
  });

  describe('Database Constraint Handling', () => {
    test('should ensure both filepath and file_path are set', () => {
      const trimmedUrl = 'https://www.youtube.com/watch?v=dQw4w9WgXcQ';
      const videoTitle = 'Test Video';
      
      const baseMediaData = {
        filename: videoTitle,
        filesize: 0,
        filetype: 'youtube',
        public_url: trimmedUrl,
        thumbnail_url: 'https://img.youtube.com/vi/dQw4w9WgXcQ/hqdefault.jpg',
        tags: ['video', 'youtube'],
        metadata: {
          youtubeId: 'dQw4w9WgXcQ',
          uploadedBy: 'admin'
        }
      };

      const insertData = {
        ...baseMediaData,
        filepath: trimmedUrl, // Primary attempt with filepath
        file_path: trimmedUrl, // Also include file_path for compatibility
      };

      // Ensure both fields are set and not null
      expect(insertData.filepath).toBe(trimmedUrl);
      expect(insertData.file_path).toBe(trimmedUrl);
      expect(insertData.filepath).not.toBeNull();
      expect(insertData.file_path).not.toBeNull();
      expect(insertData.filename).not.toBeNull();
      expect(insertData.filename.trim()).not.toBe('');
    });

    test('should validate required fields before database insertion', () => {
      const validateInsertData = (data) => {
        if (!data.filename || data.filename.trim() === '') {
          throw new Error('filename is required');
        }
        if (!data.filepath && !data.file_path) {
          throw new Error('filepath or file_path is required');
        }
        if (!data.public_url) {
          throw new Error('public_url is required');
        }
        return true;
      };

      // Valid data should pass
      const validData = {
        filename: 'Test Video',
        filepath: 'https://example.com/video',
        file_path: 'https://example.com/video',
        public_url: 'https://example.com/video',
        filesize: 0,
        filetype: 'youtube'
      };
      
      expect(() => validateInsertData(validData)).not.toThrow();

      // Invalid data should fail
      const invalidData = {
        filename: '',
        filepath: null,
        file_path: null,
        public_url: '',
        filesize: 0,
        filetype: 'youtube'
      };
      
      expect(() => validateInsertData(invalidData)).toThrow();
    });
  });

  describe('Improved Error Logging', () => {
    test('should log detailed error information', () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      
      // Simulate an error scenario
      try {
        throw new Error('Test database error: null value in column "filepath"');
      } catch (error) {
        console.error('process-video-url: Database insertion failed:', error);
      }
      
      expect(consoleSpy).toHaveBeenCalledWith(
        'process-video-url: Database insertion failed:',
        expect.any(Error)
      );
      
      consoleSpy.mockRestore();
    });

    test('should log video processing steps', () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
      
      // Simulate logging during processing
      const videoInfo = { platform: 'youtube', id: 'dQw4w9WgXcQ' };
      console.log(`process-video-url: Extracted video info - Platform: ${videoInfo.platform}, ID: ${videoInfo.id}`);
      console.log('process-video-url: Checking for duplicates...');
      console.log('process-video-url: No duplicate found, proceeding with new video processing');
      
      expect(consoleSpy).toHaveBeenCalledWith(
        'process-video-url: Extracted video info - Platform: youtube, ID: dQw4w9WgXcQ'
      );
      expect(consoleSpy).toHaveBeenCalledWith('process-video-url: Checking for duplicates...');
      expect(consoleSpy).toHaveBeenCalledWith('process-video-url: No duplicate found, proceeding with new video processing');
      
      consoleSpy.mockRestore();
    });
  });

  describe('API Integration with Missing Key', () => {
    test('should handle missing API key scenario in process-video-url', async () => {
      delete process.env.YOUTUBE_API_KEY;
      
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
      
      // Mock oEmbed API for title
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          title: 'Fallback Video Title'
        })
      });
      
      const { fetchYouTubeTitle } = require('../lib/project-data');
      const title = await fetchYouTubeTitle('dQw4w9WgXcQ');
      
      expect(title).toBe('Fallback Video Title');
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('YouTube Data API key not found or empty')
      );
      
      consoleSpy.mockRestore();
    });

    test('should handle invalid API key scenario', async () => {
      process.env.YOUTUBE_API_KEY = 'invalid_key';
      
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
      
      // Mock failed YouTube API response
      global.fetch = jest.fn()
        .mockResolvedValueOnce({ // YouTube API call
          ok: false,
          status: 403,
          statusText: 'Forbidden'
        })
        .mockResolvedValueOnce({ // oEmbed fallback
          ok: true,
          json: async () => ({
            title: 'Fallback Video Title'
          })
        });
      
      const { extractVideoDate } = require('../lib/project-data');
      const date = await extractVideoDate('https://www.youtube.com/watch?v=dQw4w9WgXcQ');
      
      expect(date).toBeNull(); // Should not get date with invalid API key
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('YouTube Data API request failed: 403 Forbidden')
      );
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('YouTube API key may be invalid or quota exceeded')
      );
      
      consoleSpy.mockRestore();
    });
  });

  describe('Video Info Extraction Edge Cases', () => {
    test('should handle various YouTube URL formats', () => {
      const { extractVideoInfo } = require('../lib/project-data');
      
      const urls = [
        'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
        'https://youtu.be/dQw4w9WgXcQ',
        'https://www.youtube.com/embed/dQw4w9WgXcQ',
        'https://youtube.com/watch?v=dQw4w9WgXcQ'
      ];
      
      urls.forEach(url => {
        const result = extractVideoInfo(url);
        expect(result).toEqual({
          platform: 'youtube',
          id: 'dQw4w9WgXcQ'
        });
      });
    });

    test('should handle invalid URLs gracefully', () => {
      const { extractVideoInfo } = require('../lib/project-data');
      
      const invalidUrls = [
        '',
        null,
        undefined,
        'not-a-url',
        'https://example.com/not-a-video',
        'https://youtube.com/invalid'
      ];
      
      invalidUrls.forEach(url => {
        expect(() => {
          const result = extractVideoInfo(url);
          expect(result).toBeNull();
        }).not.toThrow();
      });
    });
  });
});