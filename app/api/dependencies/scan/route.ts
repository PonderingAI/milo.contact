import { NextResponse } from "next/server"

export async function POST() {
  try {
    console.log("Running full dependency scan...")

    // Run check-updates
    const updatesResponse = await fetch("http://localhost:3000/api/dependencies/check-updates", {
      method: "POST",
    })

    if (!updatesResponse.ok) {
      console.error("Error checking for updates:", await updatesResponse.text())
    }

    const updatesData = await updatesResponse.json()

    // Run audit
    const auditResponse = await fetch("http://localhost:3000/api/dependencies/audit", {
      method: "POST",
    })

    if (!auditResponse.ok) {
      console.error("Error running audit:", await auditResponse.text())
    }

    const auditData = await auditResponse.json()

    return NextResponse.json({
      success: true,
      updates: updatesData,
      audit: auditData,
    })
  } catch (error) {
    console.error("Error running dependency scan:", error)

    return NextResponse.json(
      {
        error: "Failed to run dependency scan",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    )
  }
}
