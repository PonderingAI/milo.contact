import { NextResponse } from "next/server"
import { exec } from "child_process"
import { promisify } from "util"
import { createAdminClient } from "@/lib/supabase-server"

const execAsync = promisify(exec)

export async function POST(request: Request) {
  try {
    const { name, version } = await request.json()

    if (!name) {
      return NextResponse.json({ error: "Package name is required" }, { status: 400 })
    }

    // Run npm update for the specific package
    const updateCommand = version ? `npm install ${name}@${version} --save-exact` : `npm update ${name}`

    console.log(`Executing: ${updateCommand}`)

    const { stdout, stderr } = await execAsync(updateCommand, { timeout: 60000 })

    // Get the new version
    const { stdout: lsOutput } = await execAsync(`npm ls ${name} --json --depth=0`)
    const lsData = JSON.parse(lsOutput)
    const newVersion = lsData.dependencies?.[name]?.version

    // Update the database if it exists
    const supabase = createAdminClient()

    // Check if dependencies table exists
    const { data: tableExists, error: checkError } = await supabase.rpc("check_table_exists", {
      table_name: "dependencies",
    })

    if (!checkError && tableExists) {
      // Update the dependency in the database
      const { error: updateError } = await supabase.from("dependencies").upsert(
        {
          name,
          current_version: newVersion,
          latest_version: newVersion,
          has_security_update: false,
          last_updated: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        { onConflict: "name" },
      )

      if (updateError) {
        console.error("Error updating dependency in database:", updateError)
      }
    }

    return NextResponse.json({
      success: true,
      name,
      newVersion,
      stdout,
      stderr,
    })
  } catch (error) {
    console.error("Error updating dependency:", error)
    return NextResponse.json(
      {
        error: "Failed to update dependency",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    )
  }
}
