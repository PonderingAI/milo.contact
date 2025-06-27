"use client"

import React from "react"

interface ErrorBoundaryState {
  hasError: boolean
  error?: Error
  errorInfo?: React.ErrorInfo
}

interface ErrorBoundaryProps {
  children: React.ReactNode
  fallback?: React.ComponentType<{ error: Error; resetError: () => void }>
}

export class ProjectEditorErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    console.error("ProjectEditorErrorBoundary: Error caught:", error)
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("ProjectEditorErrorBoundary: Error details:", {
      error: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
    })
    
    this.setState({ 
      hasError: true, 
      error, 
      errorInfo 
    })
  }

  resetError = () => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined })
  }

  render() {
    if (this.state.hasError) {
      const { error } = this.state
      
      if (this.props.fallback) {
        const FallbackComponent = this.props.fallback
        return <FallbackComponent error={error!} resetError={this.resetError} />
      }

      return (
        <div className="min-h-screen bg-[#070a10] p-4">
          <div className="max-w-2xl mx-auto">
            <div className="bg-red-900/20 border border-red-800 rounded-lg p-6">
              <h1 className="text-xl font-semibold text-red-400 mb-4">
                Project Editor Error
              </h1>
              <p className="text-gray-300 mb-4">
                An error occurred while loading the project editor. This might be due to:
              </p>
              <ul className="list-disc list-inside text-gray-400 mb-6 space-y-1">
                <li>Database connection issues</li>
                <li>Missing project data</li>
                <li>JavaScript errors in video processing</li>
                <li>Network connectivity problems</li>
              </ul>
              
              {error && (
                <details className="mb-4">
                  <summary className="text-gray-300 cursor-pointer hover:text-gray-100">
                    Technical Details
                  </summary>
                  <div className="mt-2 p-3 bg-gray-900 rounded border border-gray-700">
                    <p className="text-red-400 text-sm mb-2">Error: {error.message}</p>
                    {error.stack && (
                      <pre className="text-xs text-gray-500 overflow-auto">
                        {error.stack}
                      </pre>
                    )}
                  </div>
                </details>
              )}
              
              <div className="flex gap-3">
                <button
                  onClick={this.resetError}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors"
                >
                  Try Again
                </button>
                <button
                  onClick={() => window.location.href = "/admin/projects"}
                  className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-md transition-colors"
                >
                  Back to Projects
                </button>
              </div>
            </div>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

export default ProjectEditorErrorBoundary