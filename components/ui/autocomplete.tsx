"use client"

import * as React from "react"
import { Check } from "lucide-react"
import { cn } from "@/lib/utils"
import { Input } from "@/components/ui/input"

interface AutocompleteProps {
  options: string[]
  value: string
  onChange: (value: string) => void
  placeholder?: string
  emptyMessage?: string
  className?: string
  allowCustomValues?: boolean
  multiple?: boolean
  separator?: string
}

export function Autocomplete({
  options,
  value,
  onChange,
  placeholder = "Search...",
  emptyMessage = "No results found.",
  className,
  allowCustomValues = true,
  multiple = false,
  separator = ",",
}: AutocompleteProps) {
  const [open, setOpen] = React.useState(false)
  const [inputValue, setInputValue] = React.useState(value)
  const inputRef = React.useRef<HTMLInputElement>(null)

  // For multiple values
  const values = React.useMemo(() => {
    if (!multiple) return [value]
    return value
      .split(separator)
      .map((v) => v.trim())
      .filter(Boolean)
  }, [value, multiple, separator])

  // Get unique options
  const uniqueOptions = React.useMemo(() => {
    return [...new Set(options)]
  }, [options])

  // Sort options by frequency (assuming most used ones are duplicated in the array)
  const sortedOptions = React.useMemo(() => {
    const counts = options.reduce(
      (acc, curr) => {
        acc[curr] = (acc[curr] || 0) + 1
        return acc
      },
      {} as Record<string, number>,
    )

    return uniqueOptions.sort((a, b) => (counts[b] || 0) - (counts[a] || 0))
  }, [options, uniqueOptions])

  // Filter options based on current input
  const filteredOptions = React.useMemo(() => {
    // Only show suggestions after at least one character is typed
    if (!inputValue.trim() || inputValue.length < 1) return []

    const searchTerm = inputValue.toLowerCase()
    return sortedOptions.filter((option) => option.toLowerCase().includes(searchTerm))
  }, [inputValue, sortedOptions])

  // Sort filtered options to prioritize those that start with the input value
  const sortedFilteredOptions = React.useMemo(() => {
    if (!inputValue.trim() || filteredOptions.length === 0) return []

    const searchTerm = inputValue.toLowerCase()
    return [...filteredOptions].sort((a, b) => {
      const aStartsWith = a.toLowerCase().startsWith(searchTerm)
      const bStartsWith = b.toLowerCase().startsWith(searchTerm)

      if (aStartsWith && !bStartsWith) return -1
      if (!aStartsWith && bStartsWith) return 1
      return a.localeCompare(b)
    })
  }, [filteredOptions, inputValue])

  // Determine if we should show suggestions
  const shouldShowSuggestions = sortedFilteredOptions.length > 0

  const handleSelect = (selectedValue: string) => {
    if (multiple) {
      // For multiple selection, append the new value
      const currentValues = values.filter((v) => v !== selectedValue)
      const newValues = [...currentValues, selectedValue]
      onChange(newValues.join(`${separator} `))
    } else {
      // For single selection
      onChange(selectedValue)
    }

    setInputValue("")
    setOpen(false)
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value
    setInputValue(newValue)

    if (allowCustomValues) {
      if (multiple) {
        // For multiple values, only update the current "active" value
        const parts = value.split(separator)
        parts[parts.length - 1] = newValue
        onChange(parts.join(`${separator} `))
      } else {
        onChange(newValue)
      }
    }

    // Auto-open dropdown if we have suggestions and at least one character
    if (newValue.trim().length >= 1) {
      setOpen(true)
    } else {
      setOpen(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Tab" && open && sortedFilteredOptions.length > 0) {
      e.preventDefault()
      handleSelect(sortedFilteredOptions[0])
    }

    if (multiple && e.key === separator) {
      e.preventDefault()
      if (inputValue.trim()) {
        handleSelect(inputValue.trim())
      }
    }
  }

  return (
    <div className="relative w-full">
      <Input
        ref={inputRef}
        value={inputValue}
        onChange={handleInputChange}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        className={cn("w-full", className)}
        onFocus={() => {
          if (inputValue.trim().length >= 1) {
            setOpen(true)
          }
        }}
        onBlur={(e) => {
          // Delay closing to allow for selection
          setTimeout(() => {
            if (!e.currentTarget.contains(document.activeElement)) {
              setOpen(false)
            }
          }, 100)
        }}
      />

      {open && shouldShowSuggestions && (
        <div className="absolute z-50 w-full mt-1 bg-white dark:bg-gray-800 rounded-md border border-gray-200 dark:border-gray-700 shadow-lg">
          <div className="max-h-60 overflow-auto">
            {sortedFilteredOptions.length === 0 ? (
              <div className="px-2 py-1.5 text-sm text-gray-500 dark:text-gray-400">{emptyMessage}</div>
            ) : (
              <div className="py-1">
                {sortedFilteredOptions.map((option) => (
                  <div
                    key={option}
                    className="px-2 py-1.5 text-sm cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center"
                    onClick={() => handleSelect(option)}
                  >
                    <Check className={cn("mr-2 h-4 w-4", values.includes(option) ? "opacity-100" : "opacity-0")} />
                    {option}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
