"use client"

import type * as React from "react"
import { cn } from "@/lib/utils"

export type ToggleState = "global" | "off" | "conservative" | "aggressive"

interface FourStateToggleProps extends React.HTMLAttributes<HTMLDivElement> {
  value: ToggleState
  onValueChange: (value: ToggleState) => void
  disabled?: boolean
  labels?: {
    global?: string
    off?: string
    conservative?: string
    aggressive?: string
  }
  showLabels?: boolean
}

export function FourStateToggle({
  value,
  onValueChange,
  disabled = false,
  labels = {
    global: "Global",
    off: "Off",
    conservative: "Security",
    aggressive: "All",
  },
  showLabels = true,
  className,
  ...props
}: FourStateToggleProps) {
  const handleClick = (newValue: ToggleState) => {
    if (!disabled) {
      onValueChange(newValue)
    }
  }

  return (
    <div
      className={cn("flex flex-col space-y-2 w-full", disabled && "opacity-50 cursor-not-allowed", className)}
      {...props}
    >
      {showLabels && (
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-gray-400">{labels.off}</span>
          <span className="text-xs font-medium text-gray-400">{labels.conservative}</span>
          <span className="text-xs font-medium text-gray-400">{labels.aggressive}</span>
          <span className="text-xs font-medium text-gray-400">{labels.global}</span>
        </div>
      )}
      <div className="relative h-10 bg-gray-800 rounded-full p-1 flex items-center">
        <div
          className={cn(
            "absolute h-8 w-1/4 rounded-full transition-all duration-200 ease-in-out",
            value === "off" && "left-1 bg-gray-600",
            value === "conservative" && "left-[calc(25%-0.25rem)] bg-blue-600",
            value === "aggressive" && "left-[calc(50%-0.5rem)] bg-green-600",
            value === "global" && "left-[calc(75%-0.75rem)] bg-purple-600",
          )}
        />
        <button
          type="button"
          className={cn(
            "relative z-10 flex-1 h-full rounded-full flex items-center justify-center text-xs font-medium",
            value === "off" ? "text-white" : "text-gray-400",
          )}
          onClick={() => handleClick("off")}
          disabled={disabled}
        >
          {!showLabels && labels.off}
        </button>
        <button
          type="button"
          className={cn(
            "relative z-10 flex-1 h-full rounded-full flex items-center justify-center text-xs font-medium",
            value === "conservative" ? "text-white" : "text-gray-400",
          )}
          onClick={() => handleClick("conservative")}
          disabled={disabled}
        >
          {!showLabels && labels.conservative}
        </button>
        <button
          type="button"
          className={cn(
            "relative z-10 flex-1 h-full rounded-full flex items-center justify-center text-xs font-medium",
            value === "aggressive" ? "text-white" : "text-gray-400",
          )}
          onClick={() => handleClick("aggressive")}
          disabled={disabled}
        >
          {!showLabels && labels.aggressive}
        </button>
        <button
          type="button"
          className={cn(
            "relative z-10 flex-1 h-full rounded-full flex items-center justify-center text-xs font-medium",
            value === "global" ? "text-white" : "text-gray-400",
          )}
          onClick={() => handleClick("global")}
          disabled={disabled}
        >
          {!showLabels && labels.global}
        </button>
      </div>
    </div>
  )
}
