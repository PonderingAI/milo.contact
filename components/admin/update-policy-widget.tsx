"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { FourStateToggle } from "@/components/ui/four-state-toggle"

interface UpdatePolicyWidgetProps {
  updateMode: string
  onUpdateModeChange: (mode: string) => void
}

export function UpdatePolicyWidget({ updateMode, onUpdateModeChange }: UpdatePolicyWidgetProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [selectedMode, setSelectedMode] = useState(updateMode)

  const handleModeChange = (mode: string) => {
    setSelectedMode(mode)
  }

  const handleSave = async () => {
    setIsLoading(true)
    await onUpdateModeChange(selectedMode)
    setIsLoading(false)
  }

  return (
    <div className="h-full flex flex-col">
      <div className="flex-1">
        <div className="mb-6">
          <h3 className="text-lg font-medium mb-2">Update Policy</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">Choose how you want to handle dependency updates</p>
        </div>

        <div className="space-y-6">
          <div className="space-y-2">
            <FourStateToggle
              options={[
                { value: "manual", label: "Manual" },
                { value: "prompt", label: "Prompt" },
                { value: "auto-minor", label: "Auto Minor" },
                { value: "auto-all", label: "Auto All" },
              ]}
              value={selectedMode}
              onChange={handleModeChange}
            />
          </div>

          <div className="p-4 bg-gray-100 dark:bg-gray-800 rounded-lg">
            <h4 className="font-medium mb-2">
              {selectedMode === "manual" && "Manual Updates"}
              {selectedMode === "prompt" && "Prompt for Updates"}
              {selectedMode === "auto-minor" && "Automatic Minor Updates"}
              {selectedMode === "auto-all" && "Automatic All Updates"}
            </h4>
            <p className="text-sm text-gray-600 dark:text-gray-300">
              {selectedMode === "manual" &&
                "You will need to manually check and apply all updates. No automatic updates will be performed."}
              {selectedMode === "prompt" &&
                "You will be prompted when updates are available, but must approve them before they are applied."}
              {selectedMode === "auto-minor" &&
                "Minor and patch updates will be applied automatically. Major updates will require your approval."}
              {selectedMode === "auto-all" &&
                "All updates including major version changes will be applied automatically without prompting."}
            </p>
          </div>
        </div>
      </div>

      <div className="mt-4 flex justify-end">
        <Button
          onClick={handleSave}
          disabled={isLoading || selectedMode === updateMode}
          className="bg-primary hover:bg-primary/90"
        >
          {isLoading ? "Saving..." : "Save Policy"}
        </Button>
      </div>
    </div>
  )
}
