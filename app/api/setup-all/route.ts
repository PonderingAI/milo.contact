import { type NextRequest, NextResponse } from "next/server"
import { isAdmin } from "@/lib/auth-utils"

export async function GET(request: NextRequest) {
  try {
    // Check if user is admin
    const adminCheck = await isAdmin()
    if (!adminCheck.isAdmin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Setup database
    const dbResponse = await fetch(new URL("/api/setup-database", request.url))
    const dbData = await dbResponse.json()

    if (!dbResponse.ok) {
      return NextResponse.json({ error: "Failed to set up database", details: dbData }, { status: 500 })
    }

    // Setup exec SQL function
    const execSqlResponse = await fetch(new URL("/api/setup-exec-sql", request.url))
    const execSqlData = await execSqlResponse.json()

    if (!execSqlResponse.ok) {
      return NextResponse.json({ error: "Failed to set up exec SQL function", details: execSqlData }, { status: 500 })
    }

    // Setup check tables function
    const checkTablesResponse = await fetch(new URL("/api/setup-check-tables-function", request.url))
    const checkTablesData = await checkTablesResponse.json()

    if (!checkTablesResponse.ok) {
      return NextResponse.json(
        { error: "Failed to set up check tables function", details: checkTablesData },
        { status: 500 },
      )
    }

    // Setup projects table
    const projectsResponse = await fetch(new URL("/api/setup-projects-table", request.url))
    const projectsData = await projectsResponse.json()

    if (!projectsResponse.ok) {
      return NextResponse.json({ error: "Failed to set up projects table", details: projectsData }, { status: 500 })
    }

    // Setup settings table
    const settingsResponse = await fetch(new URL("/api/setup-settings-table", request.url))
    const settingsData = await settingsResponse.json()

    if (!settingsResponse.ok) {
      return NextResponse.json({ error: "Failed to set up settings table", details: settingsData }, { status: 500 })
    }

    // Setup site settings
    const siteSettingsResponse = await fetch(new URL("/api/setup-site-settings", request.url))
    const siteSettingsData = await siteSettingsResponse.json()

    if (!siteSettingsResponse.ok) {
      return NextResponse.json({ error: "Failed to set up site settings", details: siteSettingsData }, { status: 500 })
    }

    // Setup tag order table
    const tagOrderResponse = await fetch(new URL("/api/setup-tag-order-table", request.url))
    const tagOrderData = await tagOrderResponse.json()

    if (!tagOrderResponse.ok) {
      return NextResponse.json({ error: "Failed to set up tag order table", details: tagOrderData }, { status: 500 })
    }

    // Setup storage
    const storageResponse = await fetch(new URL("/api/setup-storage", request.url))
    const storageData = await storageResponse.json()

    if (!storageResponse.ok) {
      return NextResponse.json({ error: "Failed to set up storage", details: storageData }, { status: 500 })
    }

    // Setup icons bucket
    const iconsBucketResponse = await fetch(new URL("/api/setup-icons-bucket", request.url))
    const iconsBucketData = await iconsBucketResponse.json()

    if (!iconsBucketResponse.ok) {
      return NextResponse.json({ error: "Failed to set up icons bucket", details: iconsBucketData }, { status: 500 })
    }

    // Setup media storage policy
    const mediaStoragePolicyResponse = await fetch(new URL("/api/setup-media-storage-policy", request.url))
    const mediaStoragePolicyData = await mediaStoragePolicyResponse.json()

    if (!mediaStoragePolicyResponse.ok) {
      return NextResponse.json(
        { error: "Failed to set up media storage policy", details: mediaStoragePolicyData },
        { status: 500 },
      )
    }

    // Setup media table
    const mediaTableResponse = await fetch(new URL("/api/setup-media-table", request.url))
    const mediaTableData = await mediaTableResponse.json()

    if (!mediaTableResponse.ok) {
      return NextResponse.json({ error: "Failed to set up media table", details: mediaTableData }, { status: 500 })
    }

    // Setup BTS images table
    const btsImagesTableResponse = await fetch(new URL("/api/setup-bts-images-table", request.url))
    const btsImagesTableData = await btsImagesTableResponse.json()

    if (!btsImagesTableResponse.ok) {
      return NextResponse.json(
        { error: "Failed to set up BTS images table", details: btsImagesTableData },
        { status: 500 },
      )
    }

    // Setup dependency tables
    const dependencyTablesResponse = await fetch(new URL("/api/setup-dependencies-tables", request.url))
    const dependencyTablesData = await dependencyTablesResponse.json()

    if (!dependencyTablesResponse.ok) {
      return NextResponse.json(
        { error: "Failed to set up dependency tables", details: dependencyTablesData },
        { status: 500 },
      )
    }

    // Setup dependency settings table
    const dependencySettingsResponse = await fetch(new URL("/api/setup-dependency-settings-table", request.url))
    const dependencySettingsData = await dependencySettingsResponse.json()

    if (!dependencySettingsResponse.ok) {
      return NextResponse.json(
        { error: "Failed to set up dependency settings table", details: dependencySettingsData },
        { status: 500 },
      )
    }

    // Setup security audits table
    const securityAuditsResponse = await fetch(new URL("/api/setup-security-audits-table", request.url))
    const securityAuditsData = await securityAuditsResponse.json()

    if (!securityAuditsResponse.ok) {
      return NextResponse.json(
        { error: "Failed to set up security audits table", details: securityAuditsData },
        { status: 500 },
      )
    }

    // Setup dependencies
    const dependenciesResponse = await fetch(new URL("/api/setup-dependencies", request.url))
    const dependenciesData = await dependenciesResponse.json()

    if (!dependenciesResponse.ok) {
      return NextResponse.json({ error: "Failed to set up dependencies", details: dependenciesData }, { status: 500 })
    }

    // Setup dependency compatibility table
    const compatibilityResponse = await fetch(new URL("/api/dependencies/setup-compatibility-table", request.url))
    const compatibilityData = await compatibilityResponse.json()

    if (!compatibilityResponse.ok) {
      return NextResponse.json(
        { error: "Failed to set up dependency compatibility table", details: compatibilityData },
        { status: 500 },
      )
    }

    return NextResponse.json({
      success: true,
      message: "All setup completed successfully",
      details: {
        database: dbData,
        execSql: execSqlData,
        checkTables: checkTablesData,
        projects: projectsData,
        settings: settingsData,
        siteSettings: siteSettingsData,
        tagOrder: tagOrderData,
        storage: storageData,
        iconsBucket: iconsBucketData,
        mediaStoragePolicy: mediaStoragePolicyData,
        mediaTable: mediaTableData,
        btsImagesTable: btsImagesTableData,
        dependencyTables: dependencyTablesData,
        dependencySettings: dependencySettingsData,
        securityAudits: securityAuditsData,
        dependencies: dependenciesData,
        compatibilityTable: compatibilityData,
      },
    })
  } catch (error) {
    console.error("Error in setup all API:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
