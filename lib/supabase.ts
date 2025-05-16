/**
 * Supabase Compatibility Layer
 *
 * This file provides backward compatibility for existing imports.
 * It re-exports functions from the new separated files with appropriate warnings.
 */

import { createClient } from "@supabase/supabase-js"
import type { SupabaseClient } from "@supabase/supabase-js"

/**
 * Create a Supabase client for server-side operations
 */
export function createServerClient(): SupabaseClient {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ""
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""

  return createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  })
}

/**
 * Create a Supabase client with admin privileges
 * This should only be used in secure server contexts
 */
export function createAdminClient(): SupabaseClient {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ""
  const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ""

  if (!supabaseServiceRoleKey) {
    console.warn("SUPABASE_SERVICE_ROLE_KEY is not defined")
    return createServerClient()
  }

  return createClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  })
}

/**
 * Get a Supabase client for browser usage
 */
export function getSupabaseBrowserClient(): SupabaseClient {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL as string
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string

  return createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      storageKey: "milo-portfolio-auth",
      persistSession: true,
      autoRefreshToken: true,
    },
  })
}

/**
 * @deprecated Use createServerClient, createAdminClient, or getSupabaseBrowserClient instead
 */
export function createClient(): SupabaseClient {
  console.warn(
    "Direct usage of createClient is deprecated. Please use createServerClient, createAdminClient, or getSupabaseBrowserClient instead.",
  )
  return createServerClient()
}
