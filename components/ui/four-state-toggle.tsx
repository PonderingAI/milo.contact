"use client"

import { useState, useEffect } from "react"
import { cn } from "@/lib/utils"

interface ToggleOption {
  value: string
  label: string
}

export type ToggleState = "off" | "conservative" | "aggressive"

interface FourStateToggleProps {
  value: ToggleState
  onChange: (value: ToggleState) => void
  options: ToggleOption[]
  className?: string
}

export function FourStateToggle({ value, onChange, options, className }: FourStateToggleProps) {
  const [selectedValue, setSelectedValue] = useState(value)

  useEffect(() => {
    setSelectedValue(value)
  }, [value])

  const handleChange = (newValue: string) => {
    setSelectedValue(newValue)
    onChange(newValue)
  }

  return (
    <div
      className={cn(
        "relative flex items-center justify-between rounded-lg bg-gray-100 p-1 dark:bg-gray-800",
        className,
      )}
    >
      {options.map((option) => (
        <button
          key={option.value}
          onClick={() => handleChange(option.value)}
          className={cn(
            "relative z-10 flex-1 px-3 py-1.5 text-sm font-medium transition-all",
            "focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-1 dark:focus:ring-gray-600",
            selectedValue === option.value
              ? "text-white"
              : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300",
          )}
        >
          {option.label}
        </button>
      ))}
      <div
        className="absolute inset-y-1 rounded-md bg-gray-900 dark:bg-gray-600 transition-all duration-200"
        style={{
          width: `${100 / options.length}%`,
          transform: `translateX(${options.findIndex((o) => o.value === selectedValue) * 100}%)`,
        }}
      />
    </div>
  )
}
