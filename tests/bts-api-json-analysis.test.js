/**
 * Step-by-step analysis of BTS API JSON parsing issues
 * This test analyzes the exact cause of the JSON parsing errors during project updates
 */

describe('BTS API JSON Parsing Analysis', () => {
  let originalFetch
  let fetchCalls = []

  beforeEach(() => {
    // Mock fetch to capture API calls
    originalFetch = global.fetch
    fetchCalls = []
    
    global.fetch = jest.fn(async (url, options) => {
      const call = { url, options }
      fetchCalls.push(call)
      console.log(`[FETCH] ${options?.method || 'GET'} ${url}`)
      
      // If it's a BTS API call, simulate the response
      if (url.includes('/api/projects/bts-images')) {
        console.log(`[FETCH] BTS API call detected`)
        console.log(`[FETCH] Request body:`, options?.body)
        
        try {
          // Parse the request body to check format
          if (options?.body) {
            const requestData = JSON.parse(options.body)
            console.log(`[FETCH] Parsed request data:`, requestData)
          }
          
          // Simulate different response scenarios
          if (url.includes('error-test')) {
            // Simulate 500 error with invalid JSON response
            return {
              ok: false,
              status: 500,
              json: async () => {
                throw new Error('JSON.parse: unexpected end of data at line 1 column 1 of the JSON data')
              },
              text: async () => 'Internal Server Error'
            }
          }
          
          // Normal successful response
          return {
            ok: true,
            status: 200,
            json: async () => ({
              success: true,
              data: [
                {
                  id: 'test-id',
                  project_id: 'test-project',
                  image_url: 'test-url',
                  created_at: new Date().toISOString()
                }
              ],
              message: 'Successfully processed 1 BTS images',
              count: 1
            })
          }
        } catch (error) {
          console.log(`[FETCH] Error processing request:`, error.message)
          // Simulate malformed response that causes JSON parsing error
          return {
            ok: false,
            status: 500,
            json: async () => {
              throw new Error('JSON.parse: unexpected end of data at line 1 column 1 of the JSON data')
            }
          }
        }
      }
      
      // For other APIs, use original fetch or return mock
      return originalFetch ? originalFetch(url, options) : {
        ok: true,
        status: 200,
        json: async () => ({ success: true })
      }
    })
  })

  afterEach(() => {
    global.fetch = originalFetch
  })

  test('Step 1: Test normal BTS API request format', async () => {
    console.log('\n=== STEP 1: Normal BTS API Request ===')
    
    const requestData = {
      projectId: 'test-project-id',
      images: ['https://example.com/image1.jpg', 'https://example.com/image2.jpg'],
      replaceExisting: true
    }
    
    console.log('Testing BTS API with valid request:', requestData)
    
    try {
      const response = await fetch('/api/projects/bts-images', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData)
      })
      
      console.log(`Response status: ${response.status}`)
      console.log(`Response ok: ${response.ok}`)
      
      const responseData = await response.json()
      console.log('Response data:', responseData)
      
      expect(response.ok).toBe(true)
      expect(responseData.success).toBe(true)
    } catch (error) {
      console.log('Request failed:', error.message)
      throw error
    }
  })

  test('Step 2: Test BTS API response parsing errors', async () => {
    console.log('\n=== STEP 2: Response Parsing Error Simulation ===')
    
    const requestData = {
      projectId: 'test-project-id',
      images: ['https://example.com/image1.jpg'],
      replaceExisting: true
    }
    
    console.log('Testing BTS API error scenario...')
    
    try {
      const response = await fetch('/api/projects/bts-images/error-test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData)
      })
      
      console.log(`Response status: ${response.status}`)
      console.log(`Response ok: ${response.ok}`)
      
      // This should trigger the JSON parsing error
      const responseData = await response.json()
      console.log('This should not be reached if JSON parsing fails')
      
    } catch (error) {
      console.log('JSON parsing error caught:', error.message)
      console.log('This is the exact error that users see in the browser')
      
      // Check if it's the specific JSON parsing error
      expect(error.message).toContain('JSON.parse: unexpected end of data')
    }
  })

  test('Step 3: Test malformed request data', async () => {
    console.log('\n=== STEP 3: Malformed Request Data ===')
    
    const malformedRequests = [
      {
        name: 'Missing projectId',
        data: {
          images: ['test.jpg'],
          replaceExisting: true
        }
      },
      {
        name: 'Invalid images array',
        data: {
          projectId: 'test',
          images: 'not-an-array',
          replaceExisting: true
        }
      },
      {
        name: 'Empty images array',
        data: {
          projectId: 'test',
          images: [],
          replaceExisting: true
        }
      }
    ]
    
    for (const testCase of malformedRequests) {
      console.log(`Testing: ${testCase.name}`)
      console.log(`Request data:`, testCase.data)
      
      try {
        const response = await fetch('/api/projects/bts-images', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(testCase.data)
        })
        
        console.log(`  Response status: ${response.status}`)
        
        if (response.ok) {
          const responseData = await response.json()
          console.log(`  Response data:`, responseData)
        } else {
          const responseData = await response.json()
          console.log(`  Error response:`, responseData)
        }
        
      } catch (error) {
        console.log(`  Request error:`, error.message)
      }
    }
  })

  test('Step 4: Test invalid JSON request body', async () => {
    console.log('\n=== STEP 4: Invalid JSON Request Body ===')
    
    const invalidJsonBodies = [
      '{"projectId": "test", "images": [}', // Missing closing bracket
      '{projectId: "test"}', // Missing quotes
      'not-json-at-all',
      '',
      null
    ]
    
    for (const body of invalidJsonBodies) {
      console.log(`Testing invalid JSON: "${body}"`)
      
      try {
        const response = await fetch('/api/projects/bts-images', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: body
        })
        
        console.log(`  Response status: ${response.status}`)
        
        if (response.status >= 400) {
          const responseData = await response.json()
          console.log(`  Error response:`, responseData)
        }
        
      } catch (error) {
        console.log(`  Request processing error:`, error.message)
      }
    }
  })

  test('Step 5: Test authentication issues', async () => {
    console.log('\n=== STEP 5: Authentication Issues ===')
    
    // Mock auth scenario where user is not authenticated
    const originalAuth = global.auth
    global.auth = jest.fn(() => ({ userId: null }))
    
    const requestData = {
      projectId: 'test-project-id',
      images: ['https://example.com/image1.jpg'],
      replaceExisting: true
    }
    
    console.log('Testing BTS API without authentication...')
    
    try {
      const response = await fetch('/api/projects/bts-images', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData)
      })
      
      console.log(`Response status: ${response.status}`)
      
      if (response.status === 401) {
        const responseData = await response.json()
        console.log('Unauthorized response:', responseData)
        expect(responseData.error).toBe('Unauthorized')
      }
      
    } catch (error) {
      console.log('Auth error:', error.message)
    } finally {
      global.auth = originalAuth
    }
  })

  test('Step 6: Analyze exact client-side error pattern', () => {
    console.log('\n=== STEP 6: Client-Side Error Analysis ===')
    
    // Simulate the exact error pattern that users see
    const simulateClientSideError = async () => {
      try {
        // This simulates what happens in the client when server returns 500 with no body
        const response = {
          ok: false,
          status: 500,
          json: async () => {
            throw new Error('JSON.parse: unexpected end of data at line 1 column 1 of the JSON data')
          }
        }
        
        console.log('Simulating client-side response handling...')
        console.log(`Response status: ${response.status}`)
        
        // This is what client code typically does
        const data = await response.json()
        console.log('Response data:', data)
        
      } catch (error) {
        console.log('Client-side JSON parsing error:', error.message)
        console.log('This matches the error reported by the user')
        
        // This is the error that appears in browser console
        expect(error.message).toContain('JSON.parse: unexpected end of data')
      }
    }
    
    return simulateClientSideError()
  })

  test('Step 7: Check template string syntax in API response', () => {
    console.log('\n=== STEP 7: Template String Syntax Check ===')
    
    // Check for template string issues that could cause JSON parsing errors
    const responseTemplates = [
      // Correct template strings
      {
        name: 'Valid template string',
        template: 'Successfully processed ${count} BTS images',
        values: { count: 5 },
        expected: 'Successfully processed 5 BTS images'
      },
      // Incorrect template strings (could cause issues)
      {
        name: 'Unescaped template string',
        template: 'Successfully processed $count BTS images',
        values: { count: 5 },
        expected: 'Successfully processed $count BTS images'
      },
      {
        name: 'Missing template literal backticks',
        template: '"Successfully processed ${count} BTS images"',
        values: { count: 5 },
        expected: '"Successfully processed ${count} BTS images"'
      }
    ]
    
    responseTemplates.forEach(test => {
      console.log(`Testing: ${test.name}`)
      console.log(`Template: ${test.template}`)
      
      try {
        // Simulate template string evaluation
        let result
        if (test.template.includes('${')) {
          // This is a template string
          result = test.template.replace(/\${(\w+)}/g, (match, key) => {
            return test.values[key] || match
          })
        } else {
          result = test.template
        }
        
        console.log(`Result: ${result}`)
        console.log(`Expected: ${test.expected}`)
        console.log(`Match: ${result === test.expected}`)
        
      } catch (error) {
        console.log(`Template error: ${error.message}`)
      }
    })
  })
})