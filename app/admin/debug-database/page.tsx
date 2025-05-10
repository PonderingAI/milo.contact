"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { DATABASE_TABLES } from "@/lib/database-schema"

export default function DebugDatabasePage() {
  const [loading, setLoading] = useState(false)
  const [allTables, setAllTables] = useState<any[]>([])
  const [checkResult, setCheckResult] = useState<any>(null)
  const [tableToCheck, setTableToCheck] = useState("")
  const [tablesToCheck, setTablesToCheck] = useState<string[]>([])
  const [directCheckResult, setDirectCheckResult] = useState<any>(null)

  // Load all tables on mount
  useEffect(() => {
    loadAllTables()
  }, [])

  const loadAllTables = async () => {
    try {
      setLoading(true)
      const response = await fetch("/api/list-all-tables")
      const data = await response.json()
      setAllTables(data.tables || [])
    } catch (error) {
      console.error("Error loading tables:", error)
    } finally {
      setLoading(false)
    }
  }

  const checkTable = async () => {
    if (!tableToCheck) return

    try {
      setLoading(true)
      const response = await fetch("/api/check-table", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ tableName: tableToCheck }),
      })
      const data = await response.json()
      setCheckResult(data)
    } catch (error) {
      console.error("Error checking table:", error)
      setCheckResult({ error: String(error) })
    } finally {
      setLoading(false)
    }
  }

  const checkMultipleTables = async () => {
    if (tablesToCheck.length === 0) return

    try {
      setLoading(true)
      const response = await fetch("/api/direct-table-check", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ tables: tablesToCheck }),
      })
      const data = await response.json()
      setDirectCheckResult(data)
    } catch (error) {
      console.error("Error checking tables:", error)
      setDirectCheckResult({ error: String(error) })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container py-10">
      <h1 className="text-3xl font-bold mb-6">Database Debugging</h1>

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>All Tables in Database</CardTitle>
            <CardDescription>List of all tables in the public schema</CardDescription>
          </CardHeader>
          <CardContent>
            {loading && <p>Loading tables...</p>}
            {!loading && allTables.length === 0 && <p>No tables found</p>}
            {!loading && allTables.length > 0 && (
              <div className="border rounded-md overflow-hidden">
                <table className="w-full">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="px-4 py-2 text-left">Table Name</th>
                      <th className="px-4 py-2 text-left">Table Type</th>
                    </tr>
                  </thead>
                  <tbody>
                    {allTables.map((table, index) => (
                      <tr key={index} className={index % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                        <td className="px-4 py-2">{table.table_name}</td>
                        <td className="px-4 py-2">{table.table_type}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
          <CardFooter>
            <Button onClick={loadAllTables} disabled={loading}>
              {loading ? "Loading..." : "Refresh Tables"}
            </Button>
          </CardFooter>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Check Single Table</CardTitle>
              <CardDescription>Check if a specific table exists</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="table-name">Table Name</Label>
                  <Input
                    id="table-name"
                    value={tableToCheck}
                    onChange={(e) => setTableToCheck(e.target.value)}
                    placeholder="Enter table name"
                  />
                </div>

                {checkResult && (
                  <div className="mt-4 p-4 rounded-md bg-gray-50">
                    <pre className="whitespace-pre-wrap text-sm">{JSON.stringify(checkResult, null, 2)}</pre>
                  </div>
                )}
              </div>
            </CardContent>
            <CardFooter>
              <Button onClick={checkTable} disabled={loading || !tableToCheck}>
                {loading ? "Checking..." : "Check Table"}
              </Button>
            </CardFooter>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Check Multiple Tables</CardTitle>
              <CardDescription>Check if multiple tables exist using direct-table-check</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Select Tables to Check</Label>
                  <div className="grid grid-cols-2 gap-2 max-h-60 overflow-y-auto border rounded-md p-2">
                    {DATABASE_TABLES.map((table) => (
                      <div key={table.name} className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id={`check-${table.name}`}
                          checked={tablesToCheck.includes(table.name)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setTablesToCheck([...tablesToCheck, table.name])
                            } else {
                              setTablesToCheck(tablesToCheck.filter((t) => t !== table.name))
                            }
                          }}
                        />
                        <label htmlFor={`check-${table.name}`} className="text-sm">
                          {table.name}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setTablesToCheck(DATABASE_TABLES.map((t) => t.name))}
                  >
                    Select All
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => setTablesToCheck([])}>
                    Clear All
                  </Button>
                </div>

                {directCheckResult && (
                  <div className="mt-4 p-4 rounded-md bg-gray-50 max-h-60 overflow-y-auto">
                    <pre className="whitespace-pre-wrap text-sm">{JSON.stringify(directCheckResult, null, 2)}</pre>
                  </div>
                )}
              </div>
            </CardContent>
            <CardFooter>
              <Button onClick={checkMultipleTables} disabled={loading || tablesToCheck.length === 0}>
                {loading ? "Checking..." : "Check Tables"}
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  )
}
