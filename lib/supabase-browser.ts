/**
 * Supabase Browser Client
 *
 * This file provides a singleton pattern for the Supabase client in browser environments.
 * It ensures only one instance of the client is created to prevent multiple GoTrueClient warnings.
 */

import { createClient } from "@supabase/supabase-js"
import type { SupabaseClient } from "@supabase/supabase-js"

// Singleton instance
let browserClient: SupabaseClient | null = null

/**
 * Get a Supabase client for browser usage
 * Uses singleton pattern to prevent multiple instances
 */
export function getSupabaseBrowserClient(): SupabaseClient {
  // For SSR, create a temporary non-persistent client
  if (typeof window === "undefined") {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

    return createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    })
  }

  // For client-side, use the singleton pattern
  if (!browserClient) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

    browserClient = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        storageKey: "milo-portfolio-auth",
        persistSession: true,
        autoRefreshToken: true,
      },
    })
  }

  return browserClient
}

/**
 * Reset the browser client (useful for testing and debugging)
 */
export function resetBrowserClient(): void {
  browserClient = null
}
