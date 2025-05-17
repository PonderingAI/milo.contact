/**
 * Re-export from lib/supabase-server.ts to fix import path issues
 */

import {
  createServerClient as originalCreateServerClient,
  createAdminClient,
  createClient,
} from "../../lib/supabase-server"

// Re-export the functions with the same names
export { createAdminClient, createClient }

// Named export for createServerClient
export const createServerClient = originalCreateServerClient
