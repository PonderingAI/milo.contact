"use client"

import { Component, type ErrorInfo, type ReactNode } from "react"
import { AlertCircle } from "lucide-react"

interface Props {
  children: ReactNode
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

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Widget error:", error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center h-full">
          <AlertCircle className="h-8 w-8 text-red-500 mb-2" />
          <p className="text-sm font-medium">Widget Error</p>
          <p className="text-xs text-muted-foreground mt-1">
            {this.state.error?.message || "An error occurred while rendering this widget"}
          </p>
        </div>
      )
    }

    return this.props.children
  }
}
