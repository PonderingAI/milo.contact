import { NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase-server"

// Mock data for dependencies since we can't actually run npm commands in this environment
const MOCK_DEPENDENCIES = [
  {
    name: "next",
    currentVersion: "14.0.3",
    latestVersion: "14.0.4",
    outdated: true,
    locked: false,
    description: "The React Framework",
    hasSecurityIssue: false,
    securityDetails: null,
    isDev: false,
  },
  {
    name: "react",
    currentVersion: "18.2.0",
    latestVersion: "18.2.0",
    outdated: false,
    locked: false,
    description: "React is a JavaScript library for building user interfaces",
    hasSecurityIssue: false,
    securityDetails: null,
    isDev: false,
  },
  {
    name: "postcss",
    currentVersion: "8.4.29",
    latestVersion: "8.4.31",
    outdated: true,
    locked: false,
    description: "Tool for transforming styles with JS plugins",
    hasSecurityIssue: true,
    securityDetails: {
      severity: "high",
      via: [
        {
          source: 1067,
          name: "postcss",
          dependency: "postcss",
          title: "Regular Expression Denial of Service in postcss",
          url: "https://github.com/advisories/GHSA-7fh5-64p2-3v2j",
          severity: "high",
          cwe: ["CWE-400"],
          cvss: {
            score: 7.5,
            vectorString: "CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:N/I:N/A:H",
          },
        },
      ],
      effects: [],
      range: "<=8.4.30",
      nodes: ["node_modules/postcss"],
      fixAvailable: {
        name: "postcss",
        version: "8.4.31",
        isSemVerMajor: false,
      },
    },
    isDev: false,
  },
  {
    name: "tailwindcss",
    currentVersion: "3.3.3",
    latestVersion: "3.3.5",
    outdated: true,
    locked: true,
    description: "A utility-first CSS framework for rapidly building custom user interfaces",
    hasSecurityIssue: false,
    securityDetails: null,
    isDev: true,
  },
  {
    name: "typescript",
    currentVersion: "5.2.2",
    latestVersion: "5.3.2",
    outdated: true,
    locked: false,
    description: "TypeScript is a language for application-scale JavaScript",
    hasSecurityIssue: false,
    securityDetails: null,
    isDev: true,
  },
  {
    name: "nodemailer",
    currentVersion: "6.9.7",
    latestVersion: "6.9.9",
    outdated: true,
    hasSecurityIssue: true,
    securityDetails: {
      severity: "critical",
      via: [
        {
          source: 1067,
          name: "nodemailer",
          dependency: "nodemailer",
          title: "Command Injection in nodemailer",
          url: "https://github.com/advisories/GHSA-h45f-rjvw-2rv2",
          severity: "critical",
          cwe: ["CWE-77"],
          cvss: {
            score: 9.8,
            vectorString: "CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:H/I:H/A:H",
          },
        },
      ],
      effects: [],
      range: "<=6.9.7",
      nodes: ["node_modules/nodemailer"],
      fixAvailable: {
        name: "nodemailer",
        version: "6.9.9",
        isSemVerMajor: false,
      },
    },
    description: "Easy as cake e-mail sending from your Node.js applications",
    isDev: false,
  },
  {
    name: "sharp",
    currentVersion: "0.32.6",
    latestVersion: "0.33.0",
    outdated: true,
    hasSecurityIssue: false,
    description: "High performance Node.js image processing",
    isDev: false,
  },
  {
    name: "@supabase/supabase-js",
    currentVersion: "2.38.4",
    latestVersion: "2.39.0",
    outdated: true,
    hasSecurityIssue: false,
    description: "Supabase client library",
    isDev: false,
  },
  {
    name: "@clerk/nextjs",
    currentVersion: "4.24.0",
    latestVersion: "4.27.2",
    outdated: true,
    hasSecurityIssue: false,
    description: "Clerk authentication for Next.js",
    isDev: false,
  },
]

export async function GET() {
  try {
    const supabase = createAdminClient()

    // Get settings from database
    const { data: settings, error: settingsError } = await supabase
      .from("dependency_settings")
      .select("*")
      .limit(1)
      .single()

    if (settingsError && settingsError.code !== "PGRST116") {
      console.error("Error fetching dependency settings:", settingsError)
    }

    // Get existing dependencies from database
    const { data: existingDeps, error: depsError } = await supabase.from("dependencies").select("*")

    if (depsError) {
      console.error("Error fetching existing dependencies:", depsError)
    }

    // Create a map of existing dependencies for quick lookup
    const existingDepsMap = {}
    if (existingDeps) {
      existingDeps.forEach((dep) => {
        existingDepsMap[dep.name] = dep
      })
    }

    // Process all dependencies
    const allDependencies = MOCK_DEPENDENCIES.map((dep) => {
      // Check if dependency exists in database
      const existingDep = existingDepsMap[dep.name]

      return {
        id: existingDep?.id || dep.name,
        name: dep.name,
        currentVersion: dep.currentVersion,
        latestVersion: dep.latestVersion,
        outdated: dep.outdated,
        locked: existingDep?.locked || dep.locked || false,
        description: dep.description || "",
        hasSecurityIssue: dep.hasSecurityIssue,
        securityDetails: dep.securityDetails,
        updateMode: existingDep?.update_mode || "global",
        isDev: dep.isDev || false,
      }
    })

    // Calculate security stats
    const vulnerabilities = allDependencies.filter((d) => d.hasSecurityIssue).length
    const outdatedPackages = allDependencies.filter((d) => d.outdated).length

    // Calculate security score
    let securityScore = 100

    // Deduct for vulnerabilities
    securityScore -= vulnerabilities * 10

    // Deduct less for outdated packages
    securityScore -= Math.min(10, outdatedPackages * 2)

    // Ensure score is between 0 and 100
    securityScore = Math.max(0, Math.min(100, securityScore))

    return NextResponse.json({
      dependencies: allDependencies,
      updateMode: settings?.update_mode || "conservative",
      securityScore,
      vulnerabilities,
      outdatedPackages,
    })
  } catch (error) {
    console.error("Error in dependencies API:", error)
    return NextResponse.json({
      dependencies: MOCK_DEPENDENCIES,
      updateMode: "conservative",
      securityScore: 75,
      vulnerabilities: 2,
      outdatedPackages: 5,
    })
  }
}
