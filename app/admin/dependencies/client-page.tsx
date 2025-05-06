"use client"

import { useEffect, useState } from "react"
import { useUser } from "@clerk/nextjs"
import { useRouter } from "next/navigation"
import AdminCheck from "@/components/admin/admin-check"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { createClient } from "@/lib/supabase-browser"

interface Dependency {
  name: string
  current_version: string
  latest_version: string | null
  required_version: string
  from: string
  resolved: string | null
  has_security_update: boolean
  update_mode: "manual" | "auto" | "conservative" | "global"
}

interface OutdatedInfo {
  current: string
  wanted: string
  latest: string
  dependent: string
  location: string
}

export default function ClientDependenciesPage() {
  const { isLoaded, isSignedIn } = useUser()
  const router = useRouter()
  const [dependencies, setDependencies] = useState<Dependency[]>([])
  const [outdatedInfo, setOutdatedInfo] = useState<Record<string, OutdatedInfo>>({})
  const [vulnerabilities, setVulnerabilities] = useState<any>({})
  const [securityScore, setSecurityScore] = useState(100)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [updateStatus, setUpdateStatus] = useState<Record<string, { loading: boolean; error: string | null }>>({})
  const [filter, setFilter] = useState<"all" | "outdated" | "vulnerable">("all")
  const [searchTerm, setSearchTerm] = useState("")
  const [showSetupSQL, setShowSetupSQL] = useState(false)
  const [sqlExecuting, setSqlExecuting] = useState(false)
  const [sqlSuccess, setSqlSuccess] = useState(false)
  const [tablesExist, setTablesExist] = useState(false)

  const supabase = createClient()

  useEffect(() => {
    if (isLoaded && !isSignedIn) {
      router.push("/sign-in?redirect_url=/admin/dependencies")
    }
  }, [isLoaded, isSignedIn, router])

  useEffect(() => {
    if (isSignedIn) {
      checkTablesExist()
      fetchDependencies()
    }
  }, [isSignedIn])

  const checkTablesExist = async () => {
    try {
      const { data: exists, error } = await supabase.rpc("check_table_exists", {
        table_name: "dependencies",
      })

      if (error) {
        console.error("Error checking if table exists:", error)
        return
      }

      setTablesExist(exists)
    } catch (err) {
      console.error("Error checking if tables exist:", err)
    }
  }

  const fetchDependencies = async () => {
    setLoading(true)
    setError(null)

    try {
      // Fetch dependencies from npm ls
      const depsResponse = await fetch("/api/dependencies/list")

      if (!depsResponse.ok) {
        const errorData = await depsResponse.json()
        throw new Error(errorData.error || "Failed to fetch dependencies")
      }

      const depsData = await depsResponse.json()
      let deps = depsData.dependencies || []

      // Fetch outdated info
      const outdatedResponse = await fetch("/api/dependencies/check-updates")

      if (outdatedResponse.ok) {
        const outdatedData = await outdatedResponse.json()
        setOutdatedInfo(outdatedData.outdated || {})

        // Update dependencies with latest version info
        deps = deps.map((dep) => ({
          ...dep,
          latest_version: outdatedData.outdated?.[dep.name]?.latest || dep.current_version,
        }))
      }

      // Fetch security audit
      const auditResponse = await fetch("/api/dependencies/audit")

      if (auditResponse.ok) {
        const auditData = await auditResponse.json()
        setVulnerabilities(auditData.vulnerabilities || {})
        setSecurityScore(auditData.securityScore || 100)

        // Update dependencies with security info
        deps = deps.map((dep) => ({
          ...dep,
          has_security_update: !!auditData.vulnerabilities?.[dep.name],
        }))
      }

      // If we have a database table, fetch stored settings
      if (tablesExist) {
        const { data: storedDeps, error: fetchError } = await supabase
          .from("dependencies")
          .select("name, update_mode, locked")

        if (!fetchError && storedDeps) {
          // Create a map for quick lookup
          const storedDepsMap = {}
          storedDeps.forEach((dep) => {
            storedDepsMap[dep.name] = dep
          })

          // Update dependencies with stored settings
          deps = deps.map((dep) => ({
            ...dep,
            update_mode: storedDepsMap[dep.name]?.update_mode || "global",
            locked: storedDepsMap[dep.name]?.locked || false,
          }))
        }
      }

      setDependencies(deps)
    } catch (err) {
      console.error("Error fetching dependencies:", err)
      setError(err instanceof Error ? err.message : "An unexpected error occurred")
    } finally {
      setLoading(false)
    }
  }

  const updateDependency = async (name: string) => {
    setUpdateStatus((prev) => ({
      ...prev,
      [name]: { loading: true, error: null },
    }))

    try {
      const response = await fetch("/api/dependencies/update", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to update dependency")
      }

      // Refresh dependencies
      await fetchDependencies()

      setUpdateStatus((prev) => ({
        ...prev,
        [name]: { loading: false, error: null },
      }))
    } catch (err) {
      console.error("Error updating dependency:", err)

      setUpdateStatus((prev) => ({
        ...prev,
        [name]: {
          loading: false,
          error: err instanceof Error ? err.message : "An unexpected error occurred",
        },
      }))
    }
  }

  const updateSettings = async (name: string, settings: { update_mode?: string; locked?: boolean }) => {
    if (!tablesExist) {
      setError("Database tables not set up. Please set up the tables first.")
      setShowSetupSQL(true)
      return
    }

    try {
      // Check if the dependency already exists in the database
      const { data: existingDep, error: fetchError } = await supabase
        .from("dependencies")
        .select("id")
        .eq("name", name)
        .single()

      if (fetchError && fetchError.code !== "PGRST116") {
        throw new Error(fetchError.message)
      }

      if (existingDep) {
        // Update existing record
        const { error: updateError } = await supabase
          .from("dependencies")
          .update({
            ...settings,
            updated_at: new Date().toISOString(),
          })
          .eq("name", name)

        if (updateError) {
          throw new Error(updateError.message)
        }
      } else {
        // Insert new record
        const dep = dependencies.find((d) => d.name === name)
        if (!dep) {
          throw new Error("Dependency not found")
        }

        const { error: insertError } = await supabase.from("dependencies").insert({
          name,
          current_version: dep.current_version,
          latest_version: dep.latest_version,
          has_security_update: dep.has_security_update,
          ...settings,
        })

        if (insertError) {
          throw new Error(insertError.message)
        }
      }

      // Update local state
      setDependencies((prev) => prev.map((dep) => (dep.name === name ? { ...dep, ...settings } : dep)))
    } catch (err) {
      console.error("Error updating settings:", err)
      setError(err instanceof Error ? err.message : "An unexpected error occurred")
    }
  }

  const runSQL = async () => {
    setSqlExecuting(true)
    setSqlSuccess(false)
    setError(null)

    try {
      const sql = `
-- Create dependencies table
CREATE TABLE IF NOT EXISTS dependencies (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL UNIQUE,
  current_version VARCHAR(100) NOT NULL,
  latest_version VARCHAR(100),
  locked BOOLEAN DEFAULT FALSE,
  locked_version VARCHAR(100),
  update_mode VARCHAR(50) DEFAULT 'global', -- 'manual', 'auto', 'conservative', 'global'
  last_checked TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  has_security_update BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add RLS policies
ALTER TABLE dependencies ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to read dependencies
CREATE POLICY "Allow authenticated users to read dependencies"
ON dependencies
FOR SELECT
TO authenticated
USING (true);

-- Allow authenticated users with admin role to manage dependencies
CREATE POLICY "Allow admins to manage dependencies"
ON dependencies
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM auth.users
    WHERE auth.users.id = auth.uid()
    AND auth.users.role = 'admin'
  )
);

-- Create dependency settings table
CREATE TABLE IF NOT EXISTS dependency_settings (
  id SERIAL PRIMARY KEY,
  update_mode VARCHAR(50) DEFAULT 'conservative', -- 'manual', 'auto', 'conservative'
  auto_update_enabled BOOLEAN DEFAULT FALSE,
  update_schedule VARCHAR(100) DEFAULT 'daily',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default settings
INSERT INTO dependency_settings (update_mode, auto_update_enabled, update_schedule)
VALUES ('conservative', FALSE, 'daily')
ON CONFLICT DO NOTHING;

-- Add RLS policies
ALTER TABLE dependency_settings ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to read dependency settings
CREATE POLICY "Allow authenticated users to read dependency settings"
ON dependency_settings
FOR SELECT
TO authenticated
USING (true);

-- Allow authenticated users with admin role to manage dependency settings
CREATE POLICY "Allow admins to manage dependency settings"
ON dependency_settings
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM auth.users
    WHERE auth.users.id = auth.uid()
    AND auth.users.role = 'admin'
  )
);
      `

      const { error } = await supabase.rpc("run_sql", { sql })

      if (error) {
        throw new Error(error.message)
      }

      setSqlSuccess(true)
      setTablesExist(true)

      // Sync current dependencies to the database
      for (const dep of dependencies) {
        const { error: upsertError } = await supabase.from("dependencies").upsert(
          {
            name: dep.name,
            current_version: dep.current_version,
            latest_version: dep.latest_version,
            has_security_update: dep.has_security_update,
            update_mode: "global",
          },
          { onConflict: "name" },
        )

        if (upsertError) {
          console.error(`Error syncing dependency ${dep.name}:`, upsertError)
        }
      }
    } catch (err) {
      console.error("Error executing SQL:", err)
      setError(err instanceof Error ? err.message : "An unexpected error occurred")
    } finally {
      setSqlExecuting(false)
    }
  }

  const filteredDependencies = dependencies
    .filter((dep) => {
      if (filter === "outdated") {
        return dep.latest_version && dep.current_version !== dep.latest_version
      }
      if (filter === "vulnerable") {
        return dep.has_security_update
      }
      return true
    })
    .filter((dep) => searchTerm === "" || dep.name.toLowerCase().includes(searchTerm.toLowerCase()))

  if (!isLoaded || !isSignedIn) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p>Loading...</p>
      </div>
    )
  }

  return (
    <AdminCheck>
      <div className="container mx-auto p-6">
        <h1 className="text-3xl font-bold mb-6">Dependency Management</h1>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            <p>{error}</p>
          </div>
        )}

        {!tablesExist && (
          <div className="bg-yellow-100 border border-yellow-400 text-yellow-800 px-4 py-3 rounded mb-4">
            <p className="font-bold">Database tables not set up</p>
            <p className="mt-2">
              The dependency management system requires database tables to store settings. You can still view your
              dependencies, but to save settings you need to set up the tables.
            </p>
            <div className="mt-4">
              <Button onClick={() => setShowSetupSQL(!showSetupSQL)}>
                {showSetupSQL ? "Hide Setup SQL" : "Show Setup SQL"}
              </Button>
            </div>
          </div>
        )}

        {showSetupSQL && (
          <div className="bg-gray-800 p-6 rounded-lg mb-6">
            <h2 className="text-xl font-bold mb-4">Database Setup</h2>
            <p className="mb-4">Run the following SQL to set up the necessary tables for dependency management:</p>
            <Textarea
              className="h-64 font-mono text-sm bg-gray-900 mb-4"
              readOnly
              value={`
-- Create dependencies table
CREATE TABLE IF NOT EXISTS dependencies (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL UNIQUE,
  current_version VARCHAR(100) NOT NULL,
  latest_version VARCHAR(100),
  locked BOOLEAN DEFAULT FALSE,
  locked_version VARCHAR(100),
  update_mode VARCHAR(50) DEFAULT 'global', -- 'manual', 'auto', 'conservative', 'global'
  last_checked TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  has_security_update BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add RLS policies
ALTER TABLE dependencies ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to read dependencies
CREATE POLICY "Allow authenticated users to read dependencies"
ON dependencies
FOR SELECT
TO authenticated
USING (true);

-- Allow authenticated users with admin role to manage dependencies
CREATE POLICY "Allow admins to manage dependencies"
ON dependencies
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM auth.users
    WHERE auth.users.id = auth.uid()
    AND auth.users.role = 'admin'
  )
);

-- Create dependency settings table
CREATE TABLE IF NOT EXISTS dependency_settings (
  id SERIAL PRIMARY KEY,
  update_mode VARCHAR(50) DEFAULT 'conservative', -- 'manual', 'auto', 'conservative'
  auto_update_enabled BOOLEAN DEFAULT FALSE,
  update_schedule VARCHAR(100) DEFAULT 'daily',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default settings
INSERT INTO dependency_settings (update_mode, auto_update_enabled, update_schedule)
VALUES ('conservative', FALSE, 'daily')
ON CONFLICT DO NOTHING;

-- Add RLS policies
ALTER TABLE dependency_settings ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to read dependency settings
CREATE POLICY "Allow authenticated users to read dependency settings"
ON dependency_settings
FOR SELECT
TO authenticated
USING (true);

-- Allow authenticated users with admin role to manage dependency settings
CREATE POLICY "Allow admins to manage dependency settings"
ON dependency_settings
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM auth.users
    WHERE auth.users.id = auth.uid()
    AND auth.users.role = 'admin'
  )
);`}
            />
            <div className="flex gap-2">
              <Button onClick={runSQL} disabled={sqlExecuting}>
                {sqlExecuting ? "Running..." : "Run SQL"}
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  navigator.clipboard.writeText(document.querySelector("textarea")?.value || "")
                }}
              >
                Copy SQL
              </Button>
            </div>
            {sqlSuccess && (
              <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mt-4">
                <p>SQL executed successfully! Tables have been created.</p>
              </div>
            )}
          </div>
        )}

        <div className="bg-gray-800 p-6 rounded-lg mb-8">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold">Dependency Management</h2>
            <div className="flex items-center gap-2">
              <div className="text-sm">
                Security Score:
                <span
                  className={`ml-2 px-2 py-1 rounded ${
                    securityScore > 80 ? "bg-green-500" : securityScore > 60 ? "bg-yellow-500" : "bg-red-500"
                  }`}
                >
                  {securityScore}%
                </span>
              </div>
            </div>
          </div>

          <p className="mb-4">
            Manage your project dependencies, set update preferences, and keep your project up-to-date.
          </p>

          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <button
              onClick={fetchDependencies}
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? "Refreshing..." : "Refresh Dependencies"}
            </button>

            <button
              onClick={() => {
                // This would trigger a server-side update of all eligible dependencies
                fetch("/api/dependencies/apply", { method: "POST" })
                  .then((response) => {
                    if (!response.ok) {
                      throw new Error("Failed to apply updates")
                    }
                    return response.json()
                  })
                  .then(() => {
                    fetchDependencies()
                  })
                  .catch((err) => {
                    setError(err.message)
                  })
              }}
              className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
            >
              Apply Updates Now
            </button>
          </div>

          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="flex-1">
              <label htmlFor="filter" className="block text-sm font-medium mb-1">
                Filter
              </label>
              <select
                id="filter"
                value={filter}
                onChange={(e) => setFilter(e.target.value as any)}
                className="w-full p-2 bg-gray-700 rounded"
              >
                <option value="all">All Dependencies</option>
                <option value="outdated">Outdated</option>
                <option value="vulnerable">Security Vulnerabilities</option>
              </select>
            </div>

            <div className="flex-1">
              <label htmlFor="search" className="block text-sm font-medium mb-1">
                Search
              </label>
              <input
                id="search"
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search dependencies..."
                className="w-full p-2 bg-gray-700 rounded"
              />
            </div>
          </div>
        </div>

        <div className="bg-gray-800 rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-700">
              <thead className="bg-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Package
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Current Version
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Latest Version
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider w-40">
                    Update Mode
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Lock Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-4 text-center">
                      <div className="flex justify-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
                      </div>
                      <p className="mt-2">Loading dependencies...</p>
                    </td>
                  </tr>
                ) : dependencies.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-4 text-center">
                      No dependencies found.
                    </td>
                  </tr>
                ) : filteredDependencies.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-4 text-center">
                      No dependencies match your filter criteria.
                    </td>
                  </tr>
                ) : (
                  filteredDependencies.map((dep) => (
                    <tr key={dep.name}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="font-medium">{dep.name}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">{dep.current_version}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {dep.latest_version ? (
                          <span
                            className={
                              dep.current_version === dep.latest_version
                                ? "text-green-500"
                                : dep.has_security_update
                                  ? "text-red-500"
                                  : "text-yellow-500"
                            }
                          >
                            {dep.latest_version}
                            {dep.has_security_update && (
                              <span className="ml-2 text-xs bg-red-600 text-white px-2 py-1 rounded">Security</span>
                            )}
                          </span>
                        ) : (
                          <span className="text-gray-400">Unknown</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <select
                          value={dep.update_mode}
                          onChange={(e) =>
                            updateSettings(dep.name, {
                              update_mode: e.target.value,
                            })
                          }
                          className="bg-gray-700 rounded p-1 w-full"
                          disabled={!tablesExist}
                        >
                          <option value="global">Global</option>
                          <option value="manual">Manual</option>
                          <option value="auto">Automatic</option>
                          <option value="conservative">Security Only</option>
                        </select>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <input
                            type="checkbox"
                            checked={dep.locked}
                            onChange={(e) => updateSettings(dep.name, { locked: e.target.checked })}
                            className="mr-2"
                            disabled={!tablesExist}
                          />
                          <span>Locked</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {dep.latest_version && dep.current_version !== dep.latest_version && !dep.locked && (
                          <button
                            onClick={() => updateDependency(dep.name)}
                            disabled={updateStatus[dep.name]?.loading}
                            className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 mr-2"
                          >
                            {updateStatus[dep.name]?.loading ? "Updating..." : "Update"}
                          </button>
                        )}
                        {updateStatus[dep.name]?.error && (
                          <div className="text-red-500 text-xs mt-1">{updateStatus[dep.name].error}</div>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AdminCheck>
  )
}
