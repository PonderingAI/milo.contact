/**
 * Global error tracking utility
 * Initializes error tracking and provides methods for capturing and reporting errors
 */

// Initialize error tracking
export const initErrorTracking = () => {
  if (typeof window === "undefined") return

  // Store original console methods
  const originalConsoleError = console.error
  const originalConsoleWarn = console.warn

  // Create an error store
  const errorStore: Array<{
    type: "error" | "warning" | "unhandled" | "resource" | "network"
    message: string
    stack?: string
    timestamp: number
    url?: string
    lineNumber?: number
    columnNumber?: number
  }> = []

  // Maximum number of errors to store
  const MAX_ERRORS = 100

  // Add error to store
  const addError = (error: any) => {
    if (errorStore.length >= MAX_ERRORS) {
      errorStore.shift() // Remove oldest error
    }
    errorStore.push(error)

    // Dispatch custom event for error monitors
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("error-tracked", { detail: error }))
    }
  }

  // Override console.error
  console.error = (...args) => {
    originalConsoleError.apply(console, args)

    const errorMessage = args.map((arg) => (typeof arg === "object" ? JSON.stringify(arg) : String(arg))).join(" ")

    addError({
      type: "error",
      message: errorMessage,
      timestamp: Date.now(),
      url: window.location.href,
    })
  }

  // Override console.warn
  console.warn = (...args) => {
    originalConsoleWarn.apply(console, args)

    const warnMessage = args.map((arg) => (typeof arg === "object" ? JSON.stringify(arg) : String(arg))).join(" ")

    addError({
      type: "warning",
      message: warnMessage,
      timestamp: Date.now(),
      url: window.location.href,
    })
  }

  // Listen for unhandled errors
  window.addEventListener("error", (event) => {
    addError({
      type: "unhandled",
      message: event.message,
      stack: event.error?.stack,
      timestamp: Date.now(),
      url: event.filename,
      lineNumber: event.lineno,
      columnNumber: event.colno,
    })
  })

  // Listen for unhandled promise rejections
  window.addEventListener("unhandledrejection", (event) => {
    const message =
      typeof event.reason === "object" ? event.reason.message || JSON.stringify(event.reason) : String(event.reason)

    addError({
      type: "unhandled",
      message: `Unhandled Promise Rejection: ${message}`,
      stack: event.reason?.stack,
      timestamp: Date.now(),
      url: window.location.href,
    })
  })

  // Listen for resource loading errors
  document.addEventListener(
    "error",
    (event) => {
      if (event.target && "tagName" in event.target) {
        const target = event.target as HTMLElement
        const tagName = target.tagName.toLowerCase()

        if (["link", "script", "img", "audio", "video"].includes(tagName)) {
          const src = (target as HTMLImageElement | HTMLScriptElement).src || (target as HTMLLinkElement).href

          addError({
            type: "resource",
            message: `Failed to load ${tagName}: ${src}`,
            timestamp: Date.now(),
            url: src,
          })
        }
      }
    },
    true,
  ) // Use capture phase to catch all resource errors

  // Monitor fetch and XMLHttpRequest for network errors
  const originalFetch = window.fetch
  window.fetch = async (...args) => {
    try {
      const response = await originalFetch.apply(window, args)

      if (!response.ok) {
        addError({
          type: "network",
          message: `Fetch error: ${response.status} ${response.statusText} for ${args[0]}`,
          timestamp: Date.now(),
          url: typeof args[0] === "string" ? args[0] : args[0].url,
        })
      }

      return response
    } catch (error) {
      addError({
        type: "network",
        message: `Fetch error: ${error instanceof Error ? error.message : String(error)} for ${args[0]}`,
        stack: error instanceof Error ? error.stack : undefined,
        timestamp: Date.now(),
        url: typeof args[0] === "string" ? args[0] : args[0].url,
      })
      throw error
    }
  }

  // Expose error store to window for debugging
  ;(window as any).__errorStore = errorStore
  ;(window as any).__clearErrorStore = () => {
    errorStore.length = 0
    window.dispatchEvent(new CustomEvent("errors-cleared"))
  }
  ;(window as any).__getErrorStore = () => [...errorStore]

  return {
    getErrors: () => [...errorStore],
    clearErrors: () => {
      errorStore.length = 0
      window.dispatchEvent(new CustomEvent("errors-cleared"))
    },
    addCustomError: (message: string, type: "error" | "warning" = "error") => {
      addError({
        type,
        message,
        timestamp: Date.now(),
        url: window.location.href,
      })
    },
  }
}

// Export a function to get the error store
export const getErrorStore = () => {
  if (typeof window === "undefined") return []
  return (window as any).__getErrorStore ? (window as any).__getErrorStore() : []
}

// Export a function to clear the error store
export const clearErrorStore = () => {
  if (typeof window === "undefined") return
  if ((window as any).__clearErrorStore) {
    ;(window as any).__clearErrorStore()
  }
}

// Export a function to add a custom error
export const addCustomError = (message: string, type: "error" | "warning" = "error") => {
  if (typeof window === "undefined") return

  console[type](message) // This will trigger our overridden console methods
}
