"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Shield, Lock, AlertTriangle, CheckCircle, XCircle, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"

interface SecurityTest {
  name: string
  description: string
  status: "pending" | "running" | "passed" | "failed" | "warning"
  details?: string
}

interface SecurityIssue {
  severity: "critical" | "high" | "medium" | "low" | "info"
  category: string
  description: string
  recommendation: string
  details?: string
}

export default function SecurityDebugger() {
  const [tests, setTests] = useState<SecurityTest[]>([
    {
      name: "CORS Configuration",
      description: "Checks if CORS is properly configured",
      status: "pending",
    },
    {
      name: "Content Security Policy",
      description: "Verifies Content Security Policy headers",
      status: "pending",
    },
    {
      name: "Authentication Checks",
      description: "Tests authentication mechanisms",
      status: "pending",
    },
    {
      name: "API Security",
      description: "Checks API endpoints for security issues",
      status: "pending",
    },
    {
      name: "Database Security",
      description: "Verifies database security configurations",
      status: "pending",
    },
    {
      name: "XSS Protection",
      description: "Tests for Cross-Site Scripting vulnerabilities",
      status: "pending",
    },
    {
      name: "CSRF Protection",
      description: "Checks Cross-Site Request Forgery protections",
      status: "pending",
    },
    {
      name: "Secure Headers",
      description: "Verifies security-related HTTP headers",
      status: "pending",
    },
  ])

  const [issues, setIssues] = useState<SecurityIssue[]>([])
  const [isScanning, setIsScanning] = useState(false)
  const [progress, setProgress] = useState(0)
  const [activeTab, setActiveTab] = useState("tests")

  const runSecurityTests = async () => {
    setIsScanning(true)
    setProgress(0)

    // Reset test statuses
    setTests((prev) => prev.map((test) => ({ ...test, status: "pending" })))

    // Clear previous issues
    setIssues([])

    // Run tests sequentially with visual feedback
    for (let i = 0; i < tests.length; i++) {
      // Update current test to running
      setTests((prev) => {
        const updated = [...prev]
        updated[i] = { ...updated[i], status: "running" }
        return updated
      })

      // Simulate test running
      await new Promise((resolve) => setTimeout(resolve, 1000))

      // Update progress
      setProgress(Math.round(((i + 1) / tests.length) * 100))

      // Simulate test result (in a real app, this would be an actual test)
      const testResult = await simulateTest(tests[i].name)

      // Update test status
      setTests((prev) => {
        const updated = [...prev]
        updated[i] = {
          ...updated[i],
          status: testResult.status,
          details: testResult.details,
        }
        return updated
      })

      // Add issues if any
      if (testResult.issues && testResult.issues.length > 0) {
        setIssues((prev) => [...prev, ...testResult.issues])
      }
    }

    setIsScanning(false)
    setActiveTab("issues")
  }

  // Simulate a security test (in a real app, this would be an actual test)
  const simulateTest = async (testName: string) => {
    // This is just a simulation - in a real app, you would perform actual security tests
    const results: Record<string, any> = {
      "CORS Configuration": {
        status: Math.random() > 0.7 ? "warning" : "passed",
        details: "CORS is configured, but allows some potentially unsafe origins",
        issues:
          Math.random() > 0.7
            ? [
                {
                  severity: "medium",
                  category: "CORS",
                  description: "CORS policy allows too many origins",
                  recommendation: "Restrict CORS to only necessary domains",
                },
              ]
            : [],
      },
      "Content Security Policy": {
        status: Math.random() > 0.8 ? "failed" : "passed",
        details: Math.random() > 0.8 ? "No Content Security Policy header found" : "CSP properly configured",
        issues:
          Math.random() > 0.8
            ? [
                {
                  severity: "high",
                  category: "Headers",
                  description: "Content Security Policy is missing",
                  recommendation: "Implement a strict Content Security Policy",
                },
              ]
            : [],
      },
      "Authentication Checks": {
        status: "passed",
        details: "Authentication mechanisms are properly implemented",
        issues: [],
      },
      "API Security": {
        status: Math.random() > 0.6 ? "warning" : "passed",
        details: Math.random() > 0.6 ? "Some API endpoints lack proper rate limiting" : "API endpoints are secure",
        issues:
          Math.random() > 0.6
            ? [
                {
                  severity: "medium",
                  category: "API",
                  description: "Rate limiting is not implemented on all endpoints",
                  recommendation: "Implement rate limiting on all public API endpoints",
                },
              ]
            : [],
      },
      "Database Security": {
        status: Math.random() > 0.9 ? "failed" : "passed",
        details:
          Math.random() > 0.9
            ? "RLS policies may not be properly configured"
            : "Database security is properly configured",
        issues:
          Math.random() > 0.9
            ? [
                {
                  severity: "critical",
                  category: "Database",
                  description: "Row Level Security might not be enforced on all tables",
                  recommendation: "Review and enforce RLS policies on all tables",
                },
              ]
            : [],
      },
      "XSS Protection": {
        status: "passed",
        details: "No XSS vulnerabilities detected",
        issues: [],
      },
      "CSRF Protection": {
        status: Math.random() > 0.7 ? "warning" : "passed",
        details:
          Math.random() > 0.7
            ? "CSRF protection is implemented but could be strengthened"
            : "CSRF protection is properly implemented",
        issues:
          Math.random() > 0.7
            ? [
                {
                  severity: "low",
                  category: "CSRF",
                  description: "Some forms may not have CSRF tokens",
                  recommendation: "Ensure all forms have CSRF protection",
                },
              ]
            : [],
      },
      "Secure Headers": {
        status: Math.random() > 0.5 ? "warning" : "passed",
        details:
          Math.random() > 0.5
            ? "Some recommended security headers are missing"
            : "All recommended security headers are present",
        issues:
          Math.random() > 0.5
            ? [
                {
                  severity: "low",
                  category: "Headers",
                  description: "Missing some recommended security headers",
                  recommendation: "Add X-Content-Type-Options, X-Frame-Options, and Referrer-Policy headers",
                },
              ]
            : [],
      },
    }

    return results[testName] || { status: "failed", details: "Test not implemented", issues: [] }
  }

  // Get severity count
  const getSeverityCount = (severity: string) => {
    return issues.filter((issue) => issue.severity === severity).length
  }

  // Get status count
  const getStatusCount = (status: string) => {
    return tests.filter((test) => test.status === status).length
  }

  // Get status icon
  const getStatusIcon = (status: string) => {
    switch (status) {
      case "passed":
        return <CheckCircle className="h-5 w-5 text-green-500" />
      case "failed":
        return <XCircle className="h-5 w-5 text-red-500" />
      case "warning":
        return <AlertTriangle className="h-5 w-5 text-yellow-500" />
      case "running":
        return <RefreshCw className="h-5 w-5 text-blue-500 animate-spin" />
      default:
        return <div className="h-5 w-5 rounded-full border-2 border-gray-300"></div>
    }
  }

  // Get severity badge
  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case "critical":
        return <Badge className="bg-red-500 hover:bg-red-600">Critical</Badge>
      case "high":
        return <Badge className="bg-orange-500 hover:bg-orange-600">High</Badge>
      case "medium":
        return <Badge className="bg-yellow-500 hover:bg-yellow-600 text-black">Medium</Badge>
      case "low":
        return <Badge className="bg-blue-500 hover:bg-blue-600">Low</Badge>
      default:
        return <Badge className="bg-gray-500 hover:bg-gray-600">Info</Badge>
    }
  }

  return (
    <Card className="border-green-500/20 bg-black text-green-500">
      <CardHeader className="bg-black/50 border-b border-green-500/20">
        <div className="flex justify-between items-center">
          <div>
            <CardTitle className="flex items-center gap-2 text-green-400">
              <Shield className="h-5 w-5" />
              Security Debugger
            </CardTitle>
            <CardDescription className="text-green-500/70">
              Scan for security vulnerabilities and configuration issues
            </CardDescription>
          </div>
          <Button
            onClick={runSecurityTests}
            disabled={isScanning}
            className="bg-green-900/20 text-green-400 hover:bg-green-900/30 border border-green-500/30"
          >
            {isScanning ? (
              <>
                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                Scanning...
              </>
            ) : (
              <>
                <Shield className="mr-2 h-4 w-4" />
                Run Security Scan
              </>
            )}
          </Button>
        </div>

        {isScanning && (
          <div className="mt-2">
            <div className="flex justify-between text-xs mb-1">
              <span>Scanning security configuration...</span>
              <span>{progress}%</span>
            </div>
            <Progress value={progress} className="h-1 bg-green-900/20" indicatorClassName="bg-green-500" />
          </div>
        )}
      </CardHeader>
      <CardContent className="p-0">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="w-full bg-black border-b border-green-500/20 rounded-none grid grid-cols-2">
            <TabsTrigger
              value="tests"
              className="data-[state=active]:bg-green-900/20 data-[state=active]:text-green-400 relative"
            >
              <Lock className="h-4 w-4 mr-2" />
              Security Tests
              {getStatusCount("failed") > 0 && (
                <span className="absolute top-1 right-1 flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger
              value="issues"
              className="data-[state=active]:bg-green-900/20 data-[state=active]:text-green-400 relative"
            >
              <AlertTriangle className="h-4 w-4 mr-2" />
              Security Issues
              {issues.length > 0 && (
                <span className="ml-2 bg-green-900/30 text-green-400 text-xs rounded-full px-2 py-0.5">
                  {issues.length}
                </span>
              )}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="tests" className="p-4 space-y-4 font-mono text-sm">
            <div className="grid grid-cols-4 gap-2 mb-4">
              <div className="bg-green-900/10 p-2 rounded flex items-center justify-between">
                <span>Passed:</span>
                <Badge className="bg-green-900/20 text-green-400">{getStatusCount("passed")}</Badge>
              </div>
              <div className="bg-red-900/10 p-2 rounded flex items-center justify-between">
                <span>Failed:</span>
                <Badge className="bg-red-900/20 text-red-400">{getStatusCount("failed")}</Badge>
              </div>
              <div className="bg-yellow-900/10 p-2 rounded flex items-center justify-between">
                <span>Warnings:</span>
                <Badge className="bg-yellow-900/20 text-yellow-400">{getStatusCount("warning")}</Badge>
              </div>
              <div className="bg-blue-900/10 p-2 rounded flex items-center justify-between">
                <span>Pending:</span>
                <Badge className="bg-blue-900/20 text-blue-400">{getStatusCount("pending")}</Badge>
              </div>
            </div>

            <div className="space-y-3">
              {tests.map((test, index) => (
                <div
                  key={index}
                  className={`p-3 rounded border ${
                    test.status === "failed"
                      ? "border-red-500/30 bg-red-900/10"
                      : test.status === "warning"
                        ? "border-yellow-500/30 bg-yellow-900/10"
                        : test.status === "passed"
                          ? "border-green-500/30 bg-green-900/10"
                          : "border-green-500/20 bg-green-900/5"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      {getStatusIcon(test.status)}
                      <div className="ml-3">
                        <div className="font-medium">{test.name}</div>
                        <div className="text-xs text-green-500/70">{test.description}</div>
                      </div>
                    </div>
                    <Badge
                      className={`
                        ${
                          test.status === "failed"
                            ? "bg-red-900/20 text-red-400"
                            : test.status === "warning"
                              ? "bg-yellow-900/20 text-yellow-400"
                              : test.status === "passed"
                                ? "bg-green-900/20 text-green-400"
                                : test.status === "running"
                                  ? "bg-blue-900/20 text-blue-400"
                                  : "bg-gray-900/20 text-gray-400"
                        }
                      `}
                    >
                      {test.status.charAt(0).toUpperCase() + test.status.slice(1)}
                    </Badge>
                  </div>

                  {test.details && <div className="mt-2 text-xs p-2 bg-black/30 rounded">{test.details}</div>}
                </div>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="issues" className="p-4 space-y-4 font-mono text-sm">
            {issues.length > 0 ? (
              <>
                <div className="grid grid-cols-5 gap-2 mb-4">
                  <div className="bg-red-900/10 p-2 rounded flex items-center justify-between">
                    <span>Critical:</span>
                    <Badge className="bg-red-900/20 text-red-400">{getSeverityCount("critical")}</Badge>
                  </div>
                  <div className="bg-orange-900/10 p-2 rounded flex items-center justify-between">
                    <span>High:</span>
                    <Badge className="bg-orange-900/20 text-orange-400">{getSeverityCount("high")}</Badge>
                  </div>
                  <div className="bg-yellow-900/10 p-2 rounded flex items-center justify-between">
                    <span>Medium:</span>
                    <Badge className="bg-yellow-900/20 text-yellow-400">{getSeverityCount("medium")}</Badge>
                  </div>
                  <div className="bg-blue-900/10 p-2 rounded flex items-center justify-between">
                    <span>Low:</span>
                    <Badge className="bg-blue-900/20 text-blue-400">{getSeverityCount("low")}</Badge>
                  </div>
                  <div className="bg-gray-900/10 p-2 rounded flex items-center justify-between">
                    <span>Info:</span>
                    <Badge className="bg-gray-900/20 text-gray-400">{getSeverityCount("info")}</Badge>
                  </div>
                </div>

                <div className="space-y-3">
                  {issues.map((issue, index) => (
                    <div
                      key={index}
                      className={`p-3 rounded border ${
                        issue.severity === "critical"
                          ? "border-red-500/30 bg-red-900/10"
                          : issue.severity === "high"
                            ? "border-orange-500/30 bg-orange-900/10"
                            : issue.severity === "medium"
                              ? "border-yellow-500/30 bg-yellow-900/10"
                              : issue.severity === "low"
                                ? "border-blue-500/30 bg-blue-900/10"
                                : "border-gray-500/30 bg-gray-900/10"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="font-medium">{issue.description}</div>
                        {getSeverityBadge(issue.severity)}
                      </div>

                      <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
                        <div>
                          <span className="text-green-500/70">Category:</span> {issue.category}
                        </div>
                        <div>
                          <span className="text-green-500/70">Severity:</span> {issue.severity}
                        </div>
                      </div>

                      <div className="mt-2 text-xs">
                        <span className="text-green-500/70">Recommendation:</span> {issue.recommendation}
                      </div>

                      {issue.details && <div className="mt-2 text-xs p-2 bg-black/30 rounded">{issue.details}</div>}
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="text-center py-8">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-900/20 mb-4">
                  <CheckCircle className="h-8 w-8 text-green-500" />
                </div>
                <h3 className="text-xl font-medium text-green-400 mb-2">No Security Issues Found</h3>
                <p className="text-green-500/70 max-w-md mx-auto">
                  Your application passed all security tests. Continue to monitor and scan regularly to maintain
                  security.
                </p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}
