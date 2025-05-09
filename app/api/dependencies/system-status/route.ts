import { NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase-server"
import { exec } from "child_process"
import { promisify } from "util"
import fs from "fs"
import path from "path"

const execAsync = promisify(exec)

export async function GET() {
  const status = {
    database: "unknown" as "unknown" | "ok" | "error",
    tables: "unknown" as "unknown" | "ok" | "error" | "missing",
    packageJson: "unknown" as "unknown" | "ok" | "error" | "missing",
    npm: "unknown" as "unknown" | "ok" | "error",
    details: {} as Record<string, any>,
  }

  // Check database connection
  try {
    const supabase = createAdminClient()
    const { error: connectionError } = await supabase.from("_dummy_query_").select("*").limit(1)

    // If we get a specific error about relation not existing, connection is working
    if (connectionError && connectionError.message.includes("does not exist")) {
      status.database = "ok"
    } else if (connectionError) {
      status.database = "error"
      status.details.databaseError = connectionError.message
    } else {
      status.database = "ok"
    }

    // Check if dependencies table exists
    try {
      const { data: tableExists, error: tableError } = await supabase.rpc("check_table_exists", {
        table_name: "dependencies",
      })

      if (tableError) {
        status.tables = "error"
        status.details.tableCheckError = tableError.message
      } else {
        status.tables = tableExists ? "ok" : "missing"
      }
    } catch (tableCheckError) {
      status.tables = "error"
      status.details.tableCheckError =
        tableCheckError instanceof Error ? tableCheckError.message : String(tableCheckError)

      // Try alternative method to check if table exists
      try {
        const { error: queryError } = await supabase.from("dependencies").select("count").limit(1)
        status.tables = queryError && queryError.message.includes("does not exist") ? "missing" : "ok"
      } catch (alternativeCheckError) {
        // Keep the original error status
      }
    }
  } catch (dbError) {
    status.database = "error"
    status.details.databaseError = dbError instanceof Error ? dbError.message : String(dbError)
  }

  // Check package.json
  try {
    const packageJsonPath = path.join(process.cwd(), "package.json")
    if (fs.existsSync(packageJsonPath)) {
      try {
        const packageJsonContent = fs.readFileSync(packageJsonPath, "utf8")
        JSON.parse(packageJsonContent) // Validate JSON
        status.packageJson = "ok"
      } catch (parseError) {
        status.packageJson = "error"
        status.details.packageJsonError = parseError instanceof Error ? parseError.message : String(parseError)
      }
    } else {
      status.packageJson = "missing"
    }
  } catch (fsError) {
    status.packageJson = "error"
    status.details.packageJsonError = fsError instanceof Error ? fsError.message : String(fsError)
  }

  // Check npm
  try {
    const { stdout } = await execAsync("npm --version", { timeout: 5000 })
    status.npm = "ok"
    status.details.npmVersion = stdout.trim()
  } catch (npmError) {
    status.npm = "error"
    status.details.npmError = npmError instanceof Error ? npmError.message : String(npmError)
  }

  return NextResponse.json({
    status: {
      database: status.database,
      tables: status.tables,
      packageJson: status.packageJson,
      npm: status.npm,
    },
    details: status.details,
    timestamp: new Date().toISOString(),
  })
}
