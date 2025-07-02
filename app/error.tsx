'use client'

import { useEffect } from 'react'
import { Button } from '@/components/ui/button'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error('Application error:', error)
  }, [error])

  return (
    <div className="min-h-screen flex items-center justify-center bg-black text-white">
      <div className="text-center space-y-4 p-8">
        <h2 className="text-2xl font-bold">Something went wrong!</h2>
        <p className="text-gray-400">
          An unexpected error occurred. Please try again.
        </p>
        {process.env.NODE_ENV === 'development' && (
          <details className="text-left bg-gray-900 p-4 rounded text-sm max-w-md">
            <summary className="cursor-pointer mb-2">Error Details</summary>
            <pre className="whitespace-pre-wrap text-red-400">{error.message}</pre>
          </details>
        )}
        <div className="space-x-2">
          <Button onClick={reset}>
            Try again
          </Button>
          <Button variant="outline" onClick={() => window.location.href = '/'}>
            Go to Home
          </Button>
        </div>
      </div>
    </div>
  )
}