"use client"

import { Component, type ErrorInfo, type ReactNode } from "react"
import { AlertCircle } from "lucide-react"

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
}

export class ErrorBoundaryWidget extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    console.error("Widget error:", error, errorInfo)
  }

  render(): ReactNode {
    if (this.state.hasError) {
      return (
        this.props.fallback || (
          <div className="flex flex-col items-center justify-center h-full w-full p-4 text-center">
            <AlertCircle className="h-8 w-8 text-red-500 mb-2" />
            <h3 className="text-sm font-medium mb-1">Widget Error</h3>
            <p className="text-xs text-gray-500">
              {this.state.error?.message || "Something went wrong rendering this widget"}
            </p>
          </div>
        )
      )
    }

    return this.props.children
  }
}
