/**
 * Cache Utilities
 *
 * This module provides functions for managing cache invalidation across the site.
 * It helps ensure that content changes made in the admin panel are immediately
 * reflected on the frontend without requiring a full page reload.
 */

// Track last invalidation time for each path to prevent frequent invalidations
const lastInvalidationTimes: Record<string, number> = {}
const THROTTLE_TIME = 5000 // 5 seconds between invalidations for the same path

/**
 * Invalidates the cache for a specific route or the entire site
 * Includes throttling to prevent excessive invalidations
 *
 * @param path - Optional path to invalidate (e.g., '/projects'). If not provided, invalidates the entire site.
 * @param force - Optional flag to force invalidation even if throttled
 * @returns Promise that resolves to a boolean indicating success or failure
 */
export async function invalidateCache(path = "/", force = false): Promise<boolean> {
  // Check if this path was recently invalidated
  const now = Date.now()
  const lastInvalidation = lastInvalidationTimes[path] || 0

  if (!force && now - lastInvalidation < THROTTLE_TIME) {
    console.log(`Skipping invalidation for ${path} - throttled (last: ${new Date(lastInvalidation).toISOString()})`)
    return true // Return true to avoid showing errors to users
  }

  try {
    const endpoint = "/api/revalidate"

    // Get the auth token from localStorage if available (client-side only)
    let authToken = null
    if (typeof window !== "undefined") {
      try {
        const supabaseData = localStorage.getItem("supabase.auth.token")
        if (supabaseData) {
          const parsedData = JSON.parse(supabaseData)
          authToken = parsedData?.currentSession?.access_token
        }
      } catch (e) {
        console.error("Error getting auth token:", e)
      }
    }

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    }

    // Add authorization header if token is available
    if (authToken) {
      headers["Authorization"] = `Bearer ${authToken}`
    }

    const response = await fetch(endpoint, {
      method: "POST",
      headers,
      body: JSON.stringify({ path }),
      credentials: "include", // Include cookies for auth
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error(`Failed to invalidate cache (${response.status}):`, errorText)
      return false
    }

    const data = await response.json()

    // Update last invalidation time
    if (data.revalidated) {
      lastInvalidationTimes[path] = now
    }

    return data.revalidated
  } catch (error) {
    console.error("Error invalidating cache:", error)
    return false
  }
}

/**
 * Invalidates multiple paths at once
 * Optimized to avoid unnecessary invalidations
 *
 * @param paths - Array of paths to invalidate
 * @param force - Optional flag to force invalidation even if throttled
 * @returns Promise that resolves to an object with the results for each path
 */
export async function invalidateMultiplePaths(paths: string[], force = false): Promise<Record<string, boolean>> {
  // Remove duplicates
  const uniquePaths = [...new Set(paths)]
  const results: Record<string, boolean> = {}

  // Process paths in sequence to avoid overwhelming the server
  for (const path of uniquePaths) {
    results[path] = await invalidateCache(path, force)
  }

  return results
}

/**
 * Common cache invalidation patterns
 * These are optimized to invalidate only what's necessary
 */
export const commonInvalidations = {
  /**
   * Invalidates the home page and its components
   */
  home: async (force = false) => {
    return invalidateCache("/", force)
  },

  /**
   * Invalidates all project-related pages
   */
  projects: async (force = false) => {
    return invalidateMultiplePaths(["/projects"], force)
  },

  /**
   * Invalidates site-wide settings
   * This should be called when global settings like site title, colors, etc. are changed
   */
  siteSettings: async (force = false) => {
    // Only invalidate the home page since that's where settings are primarily used
    // Other pages will get fresh data on their next natural revalidation
    return invalidateCache("/", force)
  },
}
