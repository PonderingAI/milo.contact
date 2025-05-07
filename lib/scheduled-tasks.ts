/**
 * Scheduled Tasks Utility
 *
 * This file contains utilities for running scheduled tasks like dependency checks.
 */

import { runDependencyScan, applyDependencyUpdates } from "./dependency-utils"
import { createAdminClient } from "./supabase-server"

// Check if auto-update is enabled
async function isAutoUpdateEnabled(): Promise<boolean> {
  try {
    const supabase = createAdminClient()

    // Check if dependency_settings table exists
    const { data: tableExists, error: checkError } = await supabase.rpc("check_table_exists", {
      table_name: "dependency_settings",
    })

    if (checkError || !tableExists) {
      return false
    }

    // Get settings
    const { data: settings, error: settingsError } = await supabase
      .from("dependency_settings")
      .select("auto_update_enabled")
      .limit(1)
      .single()

    if (settingsError) {
      return false
    }

    return settings?.auto_update_enabled || false
  } catch (error) {
    console.error("Error checking if auto-update is enabled:", error)
    return false
  }
}

// Run scheduled dependency check
export async function runScheduledDependencyCheck(): Promise<void> {
  try {
    console.log("Running scheduled dependency check...")

    // Run dependency scan
    await runDependencyScan()

    // Check if auto-update is enabled
    const autoUpdateEnabled = await isAutoUpdateEnabled()

    if (autoUpdateEnabled) {
      console.log("Auto-update is enabled, applying updates...")
      await applyDependencyUpdates()
    }

    console.log("Scheduled dependency check completed")
  } catch (error) {
    console.error("Error running scheduled dependency check:", error)
  }
}

// Initialize scheduled tasks
export function initializeScheduledTasks(): void {
  // Run dependency check every 24 hours
  const INTERVAL_MS = 24 * 60 * 60 * 1000 // 24 hours

  // Run initial check after 5 minutes
  setTimeout(
    () => {
      runScheduledDependencyCheck()

      // Set up interval for subsequent checks
      setInterval(runScheduledDependencyCheck, INTERVAL_MS)
    },
    5 * 60 * 1000,
  )

  console.log("Scheduled tasks initialized")
}
