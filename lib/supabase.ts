// This file serves as a compatibility layer for existing imports
// It re-exports functions from the new separated files

import { createServerClient as serverClient, createAdminClient } from "./supabase-server"
import { getSupabaseBrowserClient } from "./supabase-browser"

// Re-export for backward compatibility
export const createServerClient = serverClient
export { getSupabaseBrowserClient, createAdminClient }

// For backward compatibility with any code that might be importing createClient directly
export function createClient() {
  console.warn(
    "Direct usage of createClient is deprecated. Please use createServerClient, createAdminClient, or getSupabaseBrowserClient instead.",
  )
  return serverClient()
}
