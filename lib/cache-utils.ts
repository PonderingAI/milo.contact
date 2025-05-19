/**
 * Cache Utilities
 *
 * This module provides functions for managing cache invalidation across the site.
 * It helps ensure that content changes made in the admin panel are immediately
 * reflected on the frontend without requiring a full page reload.
 */

/**
 * Invalidates the cache for a specific route or the entire site
 *
 * @param path - Optional path to invalidate (e.g., '/projects'). If not provided, invalidates the entire site.
 * @returns Promise that resolves to a boolean indicating success or failure
 */
export async function invalidateCache(path?: string): Promise<boolean> {
  try {
    const endpoint = "/api/revalidate"
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ path: path || "/" }),
    })

    if (!response.ok) {
      console.error("Failed to invalidate cache:", await response.text())
      return false
    }

    const data = await response.json()
    return data.revalidated
  } catch (error) {
    console.error("Error invalidating cache:", error)
    return false
  }
}

/**
 * Invalidates multiple paths at once
 *
 * @param paths - Array of paths to invalidate
 * @returns Promise that resolves to an object with the results for each path
 */
export async function invalidateMultiplePaths(paths: string[]): Promise<Record<string, boolean>> {
  const results: Record<string, boolean> = {}

  for (const path of paths) {
    results[path] = await invalidateCache(path)
  }

  return results
}

/**
 * Common cache invalidation patterns
 */
export const commonInvalidations = {
  /**
   * Invalidates the home page and its components
   */
  home: async () => {
    return invalidateCache("/")
  },

  /**
   * Invalidates all project-related pages
   */
  projects: async () => {
    return invalidateMultiplePaths(["/", "/projects"])
  },

  /**
   * Invalidates site-wide settings
   * This should be called when global settings like site title, colors, etc. are changed
   */
  siteSettings: async () => {
    // Invalidate the home page and any other pages that use site settings
    return invalidateMultiplePaths(["/", "/projects", "/admin/settings"])
  },
}
