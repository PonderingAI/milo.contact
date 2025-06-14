import { NextResponse } from "next/server"

/**
 * Batch API Operations
 * Allows multiple API operations to be performed in a single request
 * This significantly reduces Edge Middleware invocations
 */
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { operations } = body

    if (!Array.isArray(operations)) {
      return NextResponse.json(
        { error: "Operations must be an array" },
        { status: 400 }
      )
    }

    const results: any[] = []
    const { origin } = new URL(request.url)

    // Process each operation
    for (const operation of operations) {
      try {
        const { method = 'GET', endpoint, data, headers = {} } = operation

        if (!endpoint) {
          results.push({
            success: false,
            error: "Missing endpoint in operation"
          })
          continue
        }

        // Construct full URL for internal API call
        const url = new URL(endpoint, origin)
        
        // Add any query parameters from the operation
        if (operation.params) {
          Object.entries(operation.params).forEach(([key, value]) => {
            url.searchParams.set(key, String(value))
          })
        }

        // Configure fetch options
        const fetchOptions: RequestInit = {
          method,
          headers: {
            'Content-Type': 'application/json',
            ...headers
          }
        }

        // Add body for POST/PUT requests
        if ((method === 'POST' || method === 'PUT') && data) {
          fetchOptions.body = JSON.stringify(data)
        }

        // Make the internal API call
        const response = await fetch(url.toString(), fetchOptions)
        const responseData = await response.json()

        results.push({
          success: response.ok,
          status: response.status,
          data: responseData,
          endpoint: endpoint
        })

      } catch (error) {
        results.push({
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
          endpoint: operation.endpoint
        })
      }
    }

    // Calculate overall success
    const overallSuccess = results.every(result => result.success)

    return NextResponse.json({
      success: overallSuccess,
      results,
      totalOperations: operations.length,
      successfulOperations: results.filter(r => r.success).length,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error("Error in batch operations:", error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error occurred"
      },
      { status: 500 }
    )
  }
}

/**
 * GET method for batch operations info
 */
export async function GET() {
  return NextResponse.json({
    info: "Batch API Operations Endpoint",
    usage: "POST with operations array to perform multiple API calls in one request",
    example: {
      operations: [
        {
          method: "GET",
          endpoint: "/api/database/diagnostics",
          params: { checks: "projects,media" }
        },
        {
          method: "POST", 
          endpoint: "/api/setup/unified",
          params: { types: "settings,storage" },
          data: { someData: "value" }
        }
      ]
    },
    benefits: [
      "Reduces Edge Middleware invocations",
      "Fewer HTTP roundtrips",
      "Better performance",
      "Atomic operations"
    ]
  })
}