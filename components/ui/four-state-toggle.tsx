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
  hideGlobal?: boolean
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
  hideGlobal = false,
  className,
  ...props
}: FourStateToggleProps) {
  const handleClick = (newValue: ToggleState) => {
    if (!disabled) {
      onValueChange(newValue)
    }
  }

  // Determine the number of options and positions
  const options = hideGlobal ? ["off", "conservative", "aggressive"] : ["off", "conservative", "aggressive", "global"]
  const optionCount = options.length
  const activeIndex = options.indexOf(value)
  const leftPosition = activeIndex >= 0 ? `${(100 / optionCount) * activeIndex}%` : "0%"
  const width = `${100 / optionCount}%`

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
          {!hideGlobal && <span className="text-xs font-medium text-gray-400">{labels.global}</span>}
        </div>
      )}
      <div className="relative h-10 bg-gray-800 rounded-full p-1 flex items-center min-w-[300px]">
        {/* Background rail */}
        <div className="absolute inset-0 m-1 bg-gray-700 rounded-full"></div>

        {/* Active slider */}
        <div
          className={cn(
            "absolute h-8 rounded-full transition-all duration-200 ease-in-out",
            value === "off" && "bg-gray-600",
            value === "conservative" && "bg-blue-600",
            value === "aggressive" && "bg-green-600",
            value === "global" && "bg-purple-600",
          )}
          style={{
            left: leftPosition,
            width: width,
          }}
        />

        {/* Buttons */}
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
        {!hideGlobal && (
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
        )}
      </div>
    </div>
  )
}
