"use client"

/**
 * Site-wide Refresh Utilities
 *
 * This module provides utilities for triggering and detecting site-wide refreshes
 * when content or settings are updated. It uses localStorage to communicate
 * refresh events across tabs and windows.
 *
 * Usage:
 * 1. When updating content/settings, call triggerSiteRefresh() to notify all clients
 * 2. In components that need to react to updates, use the useRefreshListener() hook
 *
 * @example
 * // In an admin component that updates settings:
 * import { triggerSiteRefresh } from '@/lib/refresh-utils';
 *
 * async function saveSettings() {
 *   await updateSettingsInDatabase();
 *   triggerSiteRefresh('settings');
 * }
 *
 * @example
 * // In a component that displays content that might be updated:
 * import { useRefreshListener } from '@/lib/refresh-utils';
 *
 * function MyComponent() {
 *   const [data, setData] = useState(null);
 *
 *   // This will re-fetch data whenever a refresh is triggered
 *   useRefreshListener(['settings'], () => {
 *     fetchData().then(setData);
 *   });
 *
 *   // Rest of component...
 * }
 */

import { useEffect } from "react"

// Key used in localStorage
const REFRESH_KEY = "site_refresh_timestamp"
const REFRESH_TYPE_KEY = "site_refresh_type"

/**
 * Triggers a site-wide refresh notification
 *
 * @param type - The type of refresh (e.g., 'settings', 'content', 'projects')
 * @param options - Additional options
 * @param options.immediate - If true, also refresh the current page immediately
 */
export function triggerSiteRefresh(type = "general", options: { immediate?: boolean } = {}) {
  try {
    // Store the timestamp and type in localStorage
    localStorage.setItem(REFRESH_KEY, Date.now().toString())
    localStorage.setItem(REFRESH_TYPE_KEY, type)

    // Dispatch a custom event for same-page components
    window.dispatchEvent(new CustomEvent("site-refresh", { detail: { type } }))

    // Optionally refresh the current page
    if (options.immediate) {
      window.location.reload()
    }

    console.log(`Site refresh triggered: ${type}`)
  } catch (error) {
    console.error("Failed to trigger site refresh:", error)
  }
}

/**
 * React hook to listen for site-wide refresh events
 *
 * @param types - Array of refresh types to listen for (empty array means listen for all types)
 * @param callback - Function to call when a refresh event is detected
 * @param dependencies - Additional dependencies for the effect
 */
export function useRefreshListener(types: string[] = [], callback: () => void, dependencies: any[] = []) {
  useEffect(() => {
    // Function to handle storage events
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === REFRESH_KEY) {
        const refreshType = localStorage.getItem(REFRESH_TYPE_KEY) || "general"

        // If types array is empty or includes the current refresh type
        if (types.length === 0 || types.includes(refreshType)) {
          callback()
        }
      }
    }

    // Function to handle custom events (same page)
    const handleCustomEvent = (e: CustomEvent) => {
      const refreshType = e.detail?.type || "general"

      // If types array is empty or includes the current refresh type
      if (types.length === 0 || types.includes(refreshType)) {
        callback()
      }
    }

    // Add event listeners
    window.addEventListener("storage", handleStorageChange)
    window.addEventListener("site-refresh", handleCustomEvent as EventListener)

    // Cleanup
    return () => {
      window.removeEventListener("storage", handleStorageChange)
      window.removeEventListener("site-refresh", handleCustomEvent as EventListener)
    }
  }, [callback, ...dependencies, types])
}

/**
 * Gets the last refresh timestamp and type
 *
 * @returns Object containing timestamp and type of the last refresh
 */
export function getLastRefresh() {
  try {
    const timestamp = localStorage.getItem(REFRESH_KEY)
    const type = localStorage.getItem(REFRESH_TYPE_KEY)

    return {
      timestamp: timestamp ? Number.parseInt(timestamp) : null,
      type: type || null,
    }
  } catch (error) {
    console.error("Failed to get last refresh info:", error)
    return { timestamp: null, type: null }
  }
}
