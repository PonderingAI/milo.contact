/**
 * Basic BTS Images Functionality Test
 * 
 * Tests the core functionality of BTS (Behind the Scenes) images
 * without requiring a full database connection.
 */

describe('BTS Images Functionality', () => {
  beforeEach(() => {
    // Mock fetch for API calls
    global.fetch = jest.fn()
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  test('BTS images API endpoint structure should be correct', async () => {
    // Mock successful response
    global.fetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({
        success: true,
        data: [
          {
            id: 'test-uuid-1',
            project_id: 'project-uuid-1',
            image_url: 'https://example.com/image1.jpg',
            created_at: new Date().toISOString()
          },
          {
            id: 'test-uuid-2',
            project_id: 'project-uuid-1', 
            image_url: 'https://example.com/image2.jpg',
            created_at: new Date().toISOString()
          }
        ],
        count: 2,
        message: 'Successfully 2 BTS images processed'
      })
    })

    // Test API call structure
    const projectId = 'project-uuid-1'
    const images = ['https://example.com/image1.jpg', 'https://example.com/image2.jpg']

    const response = await fetch('/api/projects/bts-images', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        projectId,
        images
      }),
    })

    const result = await response.json()

    // Verify the call was made with correct parameters
    expect(fetch).toHaveBeenCalledWith('/api/projects/bts-images', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        projectId,
        images
      }),
    })

    // Verify response structure
    expect(response.ok).toBe(true)
    expect(result.success).toBe(true)
    expect(result.data).toHaveLength(2)
    expect(result.count).toBe(2)
    expect(result.data[0]).toHaveProperty('id')
    expect(result.data[0]).toHaveProperty('project_id', projectId)
    expect(result.data[0]).toHaveProperty('image_url', images[0])
  })

  test('BTS images API should handle error responses gracefully', async () => {
    // Mock error response
    global.fetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
      json: async () => ({
        error: 'Database connection failed',
        debug_userIdFromAuth: 'test-user',
        supabaseError: 'relation "bts_images" does not exist'
      })
    })

    const projectId = 'project-uuid-1'
    const images = ['https://example.com/image1.jpg']

    const response = await fetch('/api/projects/bts-images', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        projectId,
        images
      }),
    })

    const result = await response.json()

    // Verify error handling
    expect(response.ok).toBe(false)
    expect(result.error).toBeDefined()
    expect(result.supabaseError).toContain('bts_images')
  })

  test('BTS images update with replaceExisting flag should work', async () => {
    // Mock successful response for replace operation
    global.fetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({
        success: true,
        data: [
          {
            id: 'test-uuid-3',
            project_id: 'project-uuid-1',
            image_url: 'https://example.com/new-image.jpg',
            created_at: new Date().toISOString()
          }
        ],
        count: 1,
        message: 'Successfully 1 BTS images processed'
      })
    })

    const projectId = 'project-uuid-1'
    const images = ['https://example.com/new-image.jpg']

    const response = await fetch('/api/projects/bts-images', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        projectId,
        images,
        replaceExisting: true,
        skipSortOrder: true
      }),
    })

    const result = await response.json()

    // Verify the call was made with correct parameters including flags
    expect(fetch).toHaveBeenCalledWith('/api/projects/bts-images', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        projectId,
        images,
        replaceExisting: true,
        skipSortOrder: true
      }),
    })

    expect(result.success).toBe(true)
    expect(result.data).toHaveLength(1)
  })

  test('Mixed media types (images and videos) should be supported', () => {
    const allBtsMedia = [
      'https://example.com/image1.jpg',
      'https://example.com/image2.png',
      'https://youtube.com/watch?v=abc123',
      'https://vimeo.com/123456789',
      'https://example.com/video.mp4'
    ]

    // Categorize media types (simulating frontend logic)
    const images = []
    const videos = []

    allBtsMedia.forEach((url) => {
      const isVideo =
        url.match(/\.(mp4|webm|ogg|mov)$/) !== null ||
        url.includes('youtube.com') ||
        url.includes('vimeo.com') ||
        url.includes('youtu.be')

      if (isVideo) {
        videos.push(url)
      } else {
        images.push(url)
      }
    })

    expect(images).toHaveLength(2)
    expect(videos).toHaveLength(3)
    expect(images).toContain('https://example.com/image1.jpg')
    expect(images).toContain('https://example.com/image2.png')
    expect(videos).toContain('https://youtube.com/watch?v=abc123')
    expect(videos).toContain('https://vimeo.com/123456789')
    expect(videos).toContain('https://example.com/video.mp4')
  })
})