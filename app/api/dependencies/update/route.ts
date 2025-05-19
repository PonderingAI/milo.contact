import { NextResponse } from "next/server"
import { exec } from "child_process"
import { promisify } from "util"
import { createAdminClient } from "@/lib/supabase-server"
import path from "path"
import fs from "fs"

const execAsync = promisify(exec)

export async function POST(request: Request) {
  try {
    const { name, version, updateType = "direct" } = await request.json()

    if (!name) {
      return NextResponse.json({ error: "Package name is required" }, { status: 400 })
    }

    let stdout, stderr, newVersion

    if (updateType === "package-json-only") {
      // Use npm-check-updates to update only package.json
      const updateCommand = version ? `npx npm-check-updates ${name}@${version} -u` : `npx npm-check-updates ${name} -u`

      console.log(`Executing: ${updateCommand}`)
      const result = await execAsync(updateCommand, { timeout: 60000 })
      stdout = result.stdout
      stderr = result.stderr

      // Get the new version from package.json
      const packageJsonPath = path.join(process.cwd(), "package.json")
      const packageJsonContent = fs.readFileSync(packageJsonPath, "utf8")
      const packageJson = JSON.parse(packageJsonContent)
      newVersion = packageJson.dependencies?.[name] || packageJson.devDependencies?.[name]

      // Now run npm install to actually install the package
      const { stdout: installStdout, stderr: installStderr } = await execAsync("npm install", { timeout: 120000 })
      stdout += "\n" + installStdout
      stderr += "\n" + installStderr
    } else {
      // Direct npm install (default)
      const updateCommand = version ? `npm install ${name}@${version} --save-exact` : `npm update ${name}`

      console.log(`Executing: ${updateCommand}`)
      const result = await execAsync(updateCommand, { timeout: 60000 })
      stdout = result.stdout
      stderr = result.stderr

      // Get the new version
      const { stdout: lsOutput } = await execAsync(`npm ls ${name} --json --depth=0`)
      const lsData = JSON.parse(lsOutput)
      newVersion = lsData.dependencies?.[name]?.version
    }

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
      updateType,
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
