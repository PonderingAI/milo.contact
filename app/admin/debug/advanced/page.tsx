"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { Terminal, Network, Database, FileCode, AlertTriangle, Cpu, Shield } from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { toast } from "@/components/ui/use-toast"
import NetworkDebugger from "@/components/admin/debug/network-debugger"
import DatabaseDebugger from "@/components/admin/debug/database-debugger"
import AssetDebugger from "@/components/admin/debug/asset-debugger"
import ErrorLogger from "@/components/admin/debug/error-logger"
import SystemInfo from "@/components/admin/debug/system-info"
import SecurityDebugger from "@/components/admin/debug/security-debugger"

export default function AdvancedDebugPage() {
  const [activeTab, setActiveTab] = useState("terminal")
  const [terminalHistory, setTerminalHistory] = useState<Array<{ type: string; content: string }>>([
    { type: "system", content: "Debug Terminal v1.0.0 initialized" },
    { type: "system", content: "Type 'help' for available commands" },
  ])
  const [commandInput, setCommandInput] = useState("")
  const terminalRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Auto-scroll terminal to bottom when new content is added
  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight
    }
  }, [terminalHistory])

  // Focus input when terminal tab is active
  useEffect(() => {
    if (activeTab === "terminal" && inputRef.current) {
      inputRef.current.focus()
    }
  }, [activeTab])

  const handleCommand = (e: React.FormEvent) => {
    e.preventDefault()
    if (!commandInput.trim()) return

    // Add command to history
    setTerminalHistory((prev) => [...prev, { type: "command", content: `> ${commandInput}` }])

    // Process command
    processCommand(commandInput)

    // Clear input
    setCommandInput("")
  }

  const processCommand = async (cmd: string) => {
    const command = cmd.trim().toLowerCase()

    // Basic command processing
    if (command === "help") {
      setTerminalHistory((prev) => [
        ...prev,
        { type: "response", content: "Available commands:" },
        { type: "response", content: "  help - Show this help message" },
        { type: "response", content: "  clear - Clear terminal" },
        { type: "response", content: "  test-db - Test database connection" },
        { type: "response", content: "  check-assets - Check static assets" },
        { type: "response", content: "  check-network - Run network diagnostics" },
        { type: "response", content: "  system-info - Show system information" },
      ])
    } else if (command === "clear") {
      setTerminalHistory([{ type: "system", content: "Terminal cleared" }])
    } else if (command === "test-db") {
      setTerminalHistory((prev) => [...prev, { type: "system", content: "Testing database connection..." }])
      try {
        const response = await fetch("/api/test-supabase-connection")
        const data = await response.json()
        if (data.success) {
          setTerminalHistory((prev) => [
            ...prev,
            { type: "success", content: "Database connection successful" },
            { type: "response", content: JSON.stringify(data, null, 2) },
          ])
        } else {
          setTerminalHistory((prev) => [
            ...prev,
            { type: "error", content: "Database connection failed" },
            { type: "error", content: JSON.stringify(data, null, 2) },
          ])
        }
      } catch (error) {
        setTerminalHistory((prev) => [
          ...prev,
          { type: "error", content: "Database connection test failed" },
          { type: "error", content: error instanceof Error ? error.message : String(error) },
        ])
      }
    } else if (command === "check-assets") {
      setTerminalHistory((prev) => [...prev, { type: "system", content: "Checking static assets..." }])
      // Check for common assets
      const assets = ["/favicon.ico", "/favicon-16x16.png", "/favicon-32x32.png", "/apple-touch-icon.png"]

      for (const asset of assets) {
        try {
          const response = await fetch(asset, { method: "HEAD" })
          setTerminalHistory((prev) => [
            ...prev,
            {
              type: response.ok ? "success" : "error",
              content: `${asset}: ${response.ok ? "Found" : "Not found"} (${response.status})`,
            },
          ])
        } catch (error) {
          setTerminalHistory((prev) => [
            ...prev,
            {
              type: "error",
              content: `${asset}: Error checking (${error instanceof Error ? error.message : String(error)})`,
            },
          ])
        }
      }
    } else if (command === "check-network") {
      setTerminalHistory((prev) => [...prev, { type: "system", content: "Running network diagnostics..." }])
      // Check basic connectivity
      try {
        const startTime = performance.now()
        const response = await fetch("/api/ping")
        const endTime = performance.now()
        const data = await response.json()
        setTerminalHistory((prev) => [
          ...prev,
          {
            type: "success",
            content: `API ping: ${Math.round(endTime - startTime)}ms`,
          },
        ])
      } catch (error) {
        setTerminalHistory((prev) => [
          ...prev,
          {
            type: "error",
            content: `API ping failed: ${error instanceof Error ? error.message : String(error)}`,
          },
        ])
      }
    } else if (command === "system-info") {
      setTerminalHistory((prev) => [...prev, { type: "system", content: "Gathering system information..." }])
      try {
        const response = await fetch("/api/system-info")
        const data = await response.json()
        setTerminalHistory((prev) => [
          ...prev,
          {
            type: "response",
            content: JSON.stringify(data, null, 2),
          },
        ])
      } catch (error) {
        setTerminalHistory((prev) => [
          ...prev,
          {
            type: "error",
            content: `Failed to get system info: ${error instanceof Error ? error.message : String(error)}`,
          },
        ])
      }
    } else {
      setTerminalHistory((prev) => [
        ...prev,
        {
          type: "error",
          content: `Unknown command: ${command}. Type 'help' for available commands.`,
        },
      ])
    }
  }

  return (
    <div className="container mx-auto p-4 space-y-6 bg-black text-green-400 min-h-screen font-mono">
      <div className="flex items-center gap-2 mb-4 border-b border-green-500/30 pb-2">
        <Terminal className="h-6 w-6" />
        <h1 className="text-2xl font-bold tracking-tight">ADVANCED SYSTEM DIAGNOSTICS</h1>
        <div className="ml-auto flex gap-2">
          <Button
            variant="outline"
            size="sm"
            className="border-green-700 text-green-400 hover:bg-green-900/20"
            onClick={() => {
              toast({
                title: "Diagnostic scan initiated",
                description: "Running full system scan...",
              })
            }}
          >
            Run Full Diagnostic
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid grid-cols-7 mb-4 bg-black border border-green-500/30">
          <TabsTrigger
            value="terminal"
            className="data-[state=active]:bg-green-900/20 data-[state=active]:text-green-400"
          >
            <Terminal className="h-4 w-4 mr-2" />
            Terminal
          </TabsTrigger>
          <TabsTrigger
            value="network"
            className="data-[state=active]:bg-green-900/20 data-[state=active]:text-green-400"
          >
            <Network className="h-4 w-4 mr-2" />
            Network
          </TabsTrigger>
          <TabsTrigger
            value="database"
            className="data-[state=active]:bg-green-900/20 data-[state=active]:text-green-400"
          >
            <Database className="h-4 w-4 mr-2" />
            Database
          </TabsTrigger>
          <TabsTrigger
            value="assets"
            className="data-[state=active]:bg-green-900/20 data-[state=active]:text-green-400"
          >
            <FileCode className="h-4 w-4 mr-2" />
            Assets
          </TabsTrigger>
          <TabsTrigger
            value="errors"
            className="data-[state=active]:bg-green-900/20 data-[state=active]:text-green-400"
          >
            <AlertTriangle className="h-4 w-4 mr-2" />
            Errors
          </TabsTrigger>
          <TabsTrigger
            value="system"
            className="data-[state=active]:bg-green-900/20 data-[state=active]:text-green-400"
          >
            <Cpu className="h-4 w-4 mr-2" />
            System
          </TabsTrigger>
          <TabsTrigger
            value="security"
            className="data-[state=active]:bg-green-900/20 data-[state=active]:text-green-400"
          >
            <Shield className="h-4 w-4 mr-2" />
            Security
          </TabsTrigger>
        </TabsList>

        <TabsContent value="terminal" className="border border-green-500/30 rounded-md p-0 bg-black">
          <div ref={terminalRef} className="h-[60vh] overflow-y-auto p-4 font-mono text-sm">
            {terminalHistory.map((entry, i) => (
              <div
                key={i}
                className={`mb-1 ${
                  entry.type === "command"
                    ? "text-green-400"
                    : entry.type === "response"
                      ? "text-gray-300"
                      : entry.type === "error"
                        ? "text-red-400"
                        : entry.type === "success"
                          ? "text-green-500"
                          : "text-blue-400"
                }`}
              >
                {entry.content}
              </div>
            ))}
          </div>
          <form onSubmit={handleCommand} className="border-t border-green-500/30 p-2 flex">
            <span className="text-green-500 mr-2">$</span>
            <input
              ref={inputRef}
              type="text"
              value={commandInput}
              onChange={(e) => setCommandInput(e.target.value)}
              className="flex-1 bg-transparent border-none outline-none text-green-400 font-mono"
              placeholder="Type command..."
              autoComplete="off"
              spellCheck="false"
            />
          </form>
        </TabsContent>

        <TabsContent value="network" className="border border-green-500/30 rounded-md p-4 bg-black">
          <NetworkDebugger />
        </TabsContent>

        <TabsContent value="database" className="border border-green-500/30 rounded-md p-4 bg-black">
          <DatabaseDebugger />
        </TabsContent>

        <TabsContent value="assets" className="border border-green-500/30 rounded-md p-4 bg-black">
          <AssetDebugger />
        </TabsContent>

        <TabsContent value="errors" className="border border-green-500/30 rounded-md p-4 bg-black">
          <ErrorLogger />
        </TabsContent>

        <TabsContent value="system" className="border border-green-500/30 rounded-md p-4 bg-black">
          <SystemInfo />
        </TabsContent>

        <TabsContent value="security" className="border border-green-500/30 rounded-md p-4 bg-black">
          <SecurityDebugger />
        </TabsContent>
      </Tabs>

      <div className="text-xs text-green-500/50 border-t border-green-500/30 pt-2 flex justify-between">
        <span>System: {typeof window !== "undefined" ? window.navigator.userAgent : "SSR"}</span>
        <span>Session: {Math.random().toString(36).substring(2, 15)}</span>
        <span>Time: {new Date().toISOString()}</span>
      </div>
    </div>
  )
}
