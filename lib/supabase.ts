import { createServerClient as createServerClientOriginal } from "./supabase-server"
import { getSupabaseBrowserClient } from "./supabase-browser"

// Re-export the functions from the new files
export { getSupabaseBrowserClient }

// For server components and API routes
export function createServerClient() {
  return createServerClientOriginal()
}

// For backward compatibility - with warning
export function createClient() {
  console.warn(
    "Direct usage of createClient is deprecated. Use createServerClient or getSupabaseBrowserClient instead.",
  )
  return createServerClientOriginal()
}
