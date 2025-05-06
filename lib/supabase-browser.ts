/**
 * Supabase Browser Client
 *
 * This file provides a singleton pattern for the Supabase client in browser environments.
 * It ensures only one instance of the client is created to prevent multiple GoTrueClient warnings.
 */

import { createClient } from "@supabase/supabase-js"
import type { SupabaseClient } from "@supabase/supabase-js"

// Singleton instances
let browserClient: SupabaseClient | null = null
let adminClient: SupabaseClient | null = null

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
 * Create a Supabase client with admin privileges
 * This should only be used in secure server contexts
 */
export function createAdminClient(): SupabaseClient {
  // For client-side, we should not expose the service role key
  if (typeof window !== "undefined") {
    console.error("Admin client should not be created in browser context")
    return getSupabaseBrowserClient()
  }

  // For server-side, use the singleton pattern
  if (!adminClient) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

    if (!supabaseServiceRoleKey) {
      throw new Error("SUPABASE_SERVICE_ROLE_KEY is not defined")
    }

    adminClient = createClient(supabaseUrl, supabaseServiceRoleKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    })
  }

  return adminClient
}

/**
 * Reset the browser client (useful for testing and debugging)
 */
export function resetBrowserClient(): void {
  browserClient = null
  adminClient = null
}
