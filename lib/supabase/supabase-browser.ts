/**
 * Supabase Browser Client
 *
 * This file provides a singleton pattern for the Supabase client in browser environments.
 * It ensures only one instance of the client is created to prevent multiple GoTrueClient warnings.
 */

import { createClient as supabaseCreateClient } from "@supabase/supabase-js"
import type { SupabaseClient } from "@supabase/supabase-js"

// Singleton instance
let supabaseBrowserClient: SupabaseClient | null = null

/**
 * Get a Supabase client for browser usage
 * Uses singleton pattern to prevent multiple instances
 */
export function getSupabaseBrowserClient(): SupabaseClient {
  if (typeof window === "undefined") {
    // For SSR, create a temporary non-persistent client
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL as string
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string

    return supabaseCreateClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    })
  }

  if (!supabaseBrowserClient) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL as string
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string

    supabaseBrowserClient = supabaseCreateClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        storageKey: "milo-portfolio-auth",
        persistSession: true,
        autoRefreshToken: true,
      },
    })
  }

  return supabaseBrowserClient
}
