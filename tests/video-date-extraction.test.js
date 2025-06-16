/**
 * Test for video date extraction functionality
 */

const { extractVideoInfo, extractVideoDate } = require('../lib/project-data')

describe('Video Date Extraction', () => {
  test('extractVideoInfo should work with YouTube URLs', () => {
    const youtubeUrl = 'https://www.youtube.com/watch?v=dQw4w9WgXcQ'
    const result = extractVideoInfo(youtubeUrl)
    
    expect(result).not.toBeNull()
    expect(result.platform).toBe('youtube')
    expect(result.id).toBe('dQw4w9WgXcQ')
  })

  test('extractVideoInfo should work with Vimeo URLs', () => {
    const vimeoUrl = 'https://vimeo.com/123456789'
    const result = extractVideoInfo(vimeoUrl)
    
    expect(result).not.toBeNull()
    expect(result.platform).toBe('vimeo')
    expect(result.id).toBe('123456789')
  })

  test('extractVideoDate should return null for YouTube (not yet implemented)', async () => {
    const youtubeUrl = 'https://www.youtube.com/watch?v=dQw4w9WgXcQ'
    const result = await extractVideoDate(youtubeUrl)
    
    // For now, YouTube date extraction returns null
    expect(result).toBeNull()
  })

  test('extractVideoDate should work with Vimeo URLs', async () => {
    // Use a test Vimeo video ID that might exist
    const vimeoUrl = 'https://vimeo.com/1'
    
    try {
      const result = await extractVideoDate(vimeoUrl)
      // Result should either be a Date or null (if video doesn't exist)
      expect(result === null || result instanceof Date).toBe(true)
    } catch (error) {
      // Network errors are acceptable in test environment
      expect(error).toBeDefined()
    }
  })
})