import { createAdminClient } from "./supabase-server"

/**
 * Check if a table exists in the database using direct SQL query
 * This avoids relying on the RPC function which seems to be failing
 */
export async function checkTableExists(tableName: string): Promise<boolean> {
  try {
    const supabase = createAdminClient()

    // Direct SQL query to check if table exists
    const { data, error } = await supabase
      .from("information_schema.tables")
      .select("table_name")
      .eq("table_schema", "public")
      .eq("table_name", tableName)
      .maybeSingle()

    if (error) {
      console.error(`Error checking if table ${tableName} exists:`, error)
      return false
    }

    return !!data
  } catch (error) {
    console.error(`Error checking if table ${tableName} exists:`, error)
    return false
  }
}

/**
 * Get all dependencies from the database
 */
export async function getDependenciesFromDatabase() {
  try {
    const supabase = createAdminClient()

    // Check if dependencies table exists first
    const tableExists = await checkTableExists("dependencies")
    if (!tableExists) {
      console.log("Dependencies table does not exist")
      return { dependencies: [], error: "Dependencies table does not exist" }
    }

    // Get dependencies
    const { data, error } = await supabase.from("dependencies").select("*")

    if (error) {
      console.error("Error fetching dependencies:", error)
      return { dependencies: [], error: error.message }
    }

    return { dependencies: data || [], error: null }
  } catch (error) {
    console.error("Error fetching dependencies:", error)
    return { dependencies: [], error: error instanceof Error ? error.message : String(error) }
  }
}
