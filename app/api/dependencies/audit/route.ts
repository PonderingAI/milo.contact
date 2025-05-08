import { NextResponse } from "next/server"
import { exec } from "child_process"
import { promisify } from "util"
import { createAdminClient } from "@/lib/supabase-server"

const execAsync = promisify(exec)

export async function GET() {
  try {
    console.log("Running npm audit to check for vulnerabilities...")

    // Run npm audit --json
    let vulnerabilities = {}

    try {
      const { stdout } = await execAsync("npm audit --json", { timeout: 30000 })

      if (stdout && stdout.trim()) {
        vulnerabilities = JSON.parse(stdout)
        console.log(`Found vulnerabilities: ${JSON.stringify(vulnerabilities.metadata || {})}`)
      }
    } catch (error) {
      // npm audit returns exit code 1 if there are vulnerabilities
      if (error instanceof Error && "stdout" in error) {
        try {
          const stdout = (error as any).stdout
          if (stdout && stdout.trim()) {
            vulnerabilities = JSON.parse(stdout)
            console.log(`Found vulnerabilities from stderr: ${JSON.stringify(vulnerabilities.metadata || {})}`)
          }
        } catch (parseError) {
          console.error("Error parsing npm audit output:", parseError)
        }
      } else {
        console.error("Error running npm audit:", error)
      }
    }

    // Update the database with the vulnerability info
    const supabase = createAdminClient()

    // Get all dependencies from the database
    const { data: dependencies, error: fetchError } = await supabase.from("dependencies").select("*")

    if (fetchError) {
      console.error("Error fetching dependencies:", fetchError)
    } else if (dependencies && dependencies.length > 0) {
      console.log(`Updating ${dependencies.length} dependencies with vulnerability info...`)

      // Get the vulnerabilities by package
      const vulnByPackage = vulnerabilities.vulnerabilities || {}

      // Update each dependency
      for (const dep of dependencies) {
        const hasVuln = !!vulnByPackage[dep.name]
        const vulnDetails = hasVuln ? JSON.stringify(vulnByPackage[dep.name]) : null

        // Update the dependency in the database
        const { error: updateError } = await supabase
          .from("dependencies")
          .update({
            has_security_update: hasVuln,
            security_details: vulnDetails,
            updated_at: new Date().toISOString(),
          })
          .eq("name", dep.name)

        if (updateError) {
          console.error(`Error updating dependency ${dep.name}:`, updateError)
        }
      }

      // Record the audit in the security_audits table
      const vulnCount = Object.keys(vulnByPackage).length
      const { error: auditError } = await supabase.from("security_audits").insert({
        scan_type: "manual",
        vulnerabilities_found: vulnCount,
        scan_result: JSON.stringify(vulnerabilities.metadata || {}),
        created_at: new Date().toISOString(),
      })

      if (auditError) {
        console.error("Error recording security audit:", auditError)
      } else {
        console.log("Security audit recorded successfully")
      }
    }

    return NextResponse.json({
      success: true,
      vulnerabilities: vulnerabilities.metadata || {},
      count: Object.keys(vulnerabilities.vulnerabilities || {}).length,
    })
  } catch (error) {
    console.error("Error running security audit:", error)

    return NextResponse.json(
      {
        error: "Failed to run security audit",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    )
  }
}

// Also support POST for manual triggering
export async function POST() {
  return GET()
}
