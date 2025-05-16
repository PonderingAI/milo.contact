/**
 * Supabase Compatibility Layer
 *
 * This file provides backward compatibility for existing imports.
 * It re-exports functions from the new separated files with appropriate warnings.
 */

import { createServerClient as serverClient, createAdminClient } from "./supabase-server"
import { getSupabaseBrowserClient } from "./supabase-browser"
import type { SupabaseClient } from "@supabase/supabase-js"

// Re-export for backward compatibility
export const createServerClient = serverClient
export { getSupabaseBrowserClient, createAdminClient }

/**
 * @deprecated Use createServerClient, createAdminClient, or getSupabaseBrowserClient instead
 */
export function createClient(): SupabaseClient {
  console.warn(
    "Direct usage of createClient is deprecated. Please use createServerClient, createAdminClient, or getSupabaseBrowserClient instead.",
  )
  return serverClient()
}
