/**
 * Supabase Server Clients
 *
 * This file provides Supabase clients for server-side usage.
 * - createServerClient: For general server-side operations
 * - createAdminClient: For operations requiring admin privileges
 * - createClient: Named export for compatibility
 */

import { createClient as supabaseCreateClient } from "@supabase/supabase-js"
import type { SupabaseClient } from "@supabase/supabase-js"

/**
 * Create a Supabase client for server components and API routes
 */
export function createServerClient(): SupabaseClient {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

  return supabaseCreateClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  })
}

/**
 * Create a Supabase client with admin privileges
 * For server actions and API routes that need full database access
 */
export function createAdminClient(): SupabaseClient {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

  return supabaseCreateClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  })
}

/**
 * Named export for createClient for compatibility
 * This is an alias for createServerClient
 */
export const createClient = createServerClient
