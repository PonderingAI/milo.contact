import { createAdminClient } from "./supabase-server"

export async function checkDependencyTablesExist() {
  try {
    const supabase = createAdminClient()

    // Try direct SQL query first
    try {
      const { data: tablesExist, error } = await supabase.rpc("check_dependency_tables_exist")

      if (!error) {
        return !!tablesExist
      }
    } catch (rpcError) {
      console.error("RPC check_dependency_tables_exist failed:", rpcError)
      // Fall through to manual check
    }

    // Manual check as fallback
    const { data: tables, error: tablesError } = await supabase
      .from("information_schema.tables")
      .select("table_name")
      .eq("table_schema", "public")
      .in("table_name", ["dependencies", "dependency_settings"])

    if (tablesError) {
      console.error("Error checking tables manually:", tablesError)
      return false
    }

    // Check if both tables exist
    const tableNames = tables?.map((t) => t.table_name) || []
    return tableNames.includes("dependencies") && tableNames.includes("dependency_settings")
  } catch (error) {
    console.error("Error checking if dependency tables exist:", error)
    return false
  }
}
