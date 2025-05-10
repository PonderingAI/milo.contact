"use client"
import { FourStateToggle } from "@/components/ui/four-state-toggle"

interface UpdatePolicyWidgetProps {
  updateMode: string
  onUpdateModeChange: (mode: string) => void
}

export default function UpdatePolicyWidget({ updateMode, onUpdateModeChange }: UpdatePolicyWidgetProps) {
  const handleModeChange = (value: string) => {
    onUpdateModeChange(value)
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">Update Policy</h3>
        <p className="text-sm text-gray-500 mb-4">Choose how you want to handle dependency updates</p>

        <FourStateToggle
          value={updateMode}
          onValueChange={handleModeChange}
          options={[
            { value: "manual", label: "Manual" },
            { value: "prompt", label: "Prompt" },
            { value: "auto-minor", label: "Auto Minor" },
            { value: "auto-all", label: "Auto All" },
          ]}
        />
      </div>

      <div className="bg-gray-50 p-4 rounded-md border border-gray-200">
        <h4 className="font-medium text-sm mb-2">Current Setting: {updateMode}</h4>
        <p className="text-xs text-gray-600">
          {updateMode === "manual" && "You will need to manually check and apply all updates."}
          {updateMode === "prompt" && "You will be prompted when updates are available."}
          {updateMode === "auto-minor" && "Minor and patch updates will be applied automatically."}
          {updateMode === "auto-all" && "All updates including major versions will be applied automatically."}
        </p>
      </div>

      <div className="flex items-center space-x-2 text-sm">
        <div className="w-3 h-3 rounded-full bg-green-500"></div>
        <span>Last checked: Today</span>
      </div>
    </div>
  )
}
