"use client"

import { useState, useEffect } from "react"
import { FourStateToggle } from "@/components/ui/four-state-toggle"
import { Button } from "@/components/ui/button"
import { AlertCircle, RefreshCw } from "lucide-react"
import { toast } from "@/components/ui/use-toast"

interface UpdatePolicyWidgetProps {
  updateMode: string
  setUpdateMode: (mode: string) => void
  resetAllSettings: () => void
  isLoading: boolean
}

export function UpdatePolicyWidget({
  updateMode,
  setUpdateMode,
  resetAllSettings,
  isLoading,
}: UpdatePolicyWidgetProps) {
  const [localUpdateMode, setLocalUpdateMode] = useState(updateMode)

  useEffect(() => {
    setLocalUpdateMode(updateMode)
  }, [updateMode])

  const handleUpdateModeChange = async (newMode: string) => {
    setLocalUpdateMode(newMode)
    setUpdateMode(newMode)

    try {
      const response = await fetch("/api/dependencies/update-mode", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ mode: newMode }),
      })

      if (!response.ok) {
        throw new Error("Failed to update mode")
      }

      toast({
        title: "Update Mode Changed",
        description: `Update mode set to ${newMode}`,
      })
    } catch (error) {
      console.error("Error updating mode:", error)
      toast({
        title: "Error",
        description: "Failed to update mode",
        variant: "destructive",
      })
    }
  }

  return (
    <div className="flex flex-col h-full">
      <div className="mb-2 flex items-center justify-between">
        <h3 className="text-lg font-semibold">Update Policy</h3>
        <div className="flex items-center space-x-1">
          <AlertCircle className="h-4 w-4 text-gray-500" />
          <span className="text-xs text-gray-500">Global Setting</span>
        </div>
      </div>

      <div className="flex-grow flex flex-col justify-center">
        <div className="bg-gray-200 dark:bg-gray-800 p-3 rounded-lg mb-4 relative">
          <div className="absolute inset-0 bg-gray-300 dark:bg-gray-700 rounded-lg m-1.5 z-0"></div>
          <FourStateToggle
            value={localUpdateMode}
            onChange={handleUpdateModeChange}
            options={[
              { value: "none", label: "None" },
              { value: "minor", label: "Minor" },
              { value: "all", label: "All" },
            ]}
            className="relative z-10"
          />
        </div>

        <div className="flex justify-between items-center mt-2">
          <div className="text-sm text-gray-600 dark:text-gray-400">
            {localUpdateMode === "none" && "No automatic updates"}
            {localUpdateMode === "minor" && "Minor version updates only"}
            {localUpdateMode === "all" && "All updates including major versions"}
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={resetAllSettings}
            disabled={isLoading}
            className="ml-2 text-xs h-8"
          >
            <RefreshCw className="h-3 w-3 mr-1" />
            Reset All
          </Button>
        </div>
      </div>
    </div>
  )
}
