/**
 * Supabase Browser Client
 *
 * This file provides a singleton pattern for the Supabase client in browser environments.
 * It ensures only one instance of the client is created to prevent multiple GoTrueClient warnings.
 */

import { createClient as supabaseCreateClient } from "@supabase/supabase-js"
import type { SupabaseClient } from "@supabase/supabase-js"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import type { Database } from "./database.types"

// Singleton instances
let browserClient: SupabaseClient | null = null
let adminClient: SupabaseClient | null = null
// Create a singleton instance of the Supabase client for client components
let supabaseBrowserClient: ReturnType<typeof createClientComponentClient<Database>> | null = null

/**
 * Create a Supabase client (compatibility export for existing code)
 * @deprecated Use getSupabaseBrowserClient instead
 */
export const createClient = (options = {}): SupabaseClient => {
  return getSupabaseBrowserClient()
}

/**
 * Get a Supabase client for browser usage
 * Uses singleton pattern to prevent multiple instances
 */
export function getSupabaseBrowserClient(): SupabaseClient {
  if (!supabaseBrowserClient) {
    // Only create the client in browser environments
    if (typeof window !== "undefined") {
      supabaseBrowserClient = createClientComponentClient<Database>()
    } else {
      // Return a mock client for server-side rendering that won't cause errors
      return {
        auth: {
          getSession: () => Promise.resolve({ data: { session: null }, error: null }),
          onAuthStateChange: () => ({ data: null, error: null, subscription: { unsubscribe: () => {} } }),
        },
        // Add other necessary mock methods
        from: () => ({
          select: () => ({ data: null, error: null }),
        }),
        storage: {
          from: () => ({
            upload: () => Promise.resolve({ data: null, error: null }),
            getPublicUrl: () => ({ data: { publicUrl: "" } }),
          }),
        },
      } as any
    }
  }
  return supabaseBrowserClient
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

    adminClient = supabaseCreateClient(supabaseUrl, supabaseServiceRoleKey, {
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

// Reset the client (useful for testing or when auth state changes)
export function resetSupabaseBrowserClient() {
  supabaseBrowserClient = null
}
