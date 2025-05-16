"use client"

import * as React from "react"
import { Input } from "@/components/ui/input"
import { CommandList, CommandGroup, CommandItem, Command } from "@/components/ui/command"

interface SimpleAutocompleteProps {
  options: string[]
  value: string
  onInputChange: (value: string) => void
  onSelect: (value: string) => void
  placeholder?: string
  className?: string
  allowCustomValues?: boolean
  multiple?: boolean
  separator?: string
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  onFocus?: () => void
  onBlur?: () => void
}

export const SimpleAutocomplete = React.forwardRef<HTMLInputElement, SimpleAutocompleteProps>(
  (
    {
      options,
      value,
      onInputChange,
      onSelect,
      placeholder,
      className,
      allowCustomValues = false,
      multiple = false,
      separator = ",",
      isOpen,
      onOpenChange,
      onFocus,
      onBlur,
    },
    ref,
  ) => {
    // Get current input value
    const currentValue = multiple ? value.split(separator).pop()?.trim() || "" : value

    // Filter and sort options
    const filteredSortedOptions = React.useMemo(() => {
      if (!currentValue) return []

      const searchTerm = currentValue.toLowerCase()

      // Count occurrences to sort by frequency
      const counts = options.reduce(
        (acc, curr) => {
          acc[curr.toLowerCase()] = (acc[curr.toLowerCase()] || 0) + 1
          return acc
        },
        {} as Record<string, number>,
      )

      // Filter options that include the search term
      const filtered = [...new Set(options)]
        .filter((option) => option.toLowerCase().includes(searchTerm))
        // Sort by: 1) exact match, 2) starts with, 3) frequency
        .sort((a, b) => {
          const aLower = a.toLowerCase()
          const bLower = b.toLowerCase()

          // Exact matches first
          if (aLower === searchTerm && bLower !== searchTerm) return -1
          if (bLower === searchTerm && aLower !== searchTerm) return 1

          // Starts with search term next
          if (aLower.startsWith(searchTerm) && !bLower.startsWith(searchTerm)) return -1
          if (bLower.startsWith(searchTerm) && !aLower.startsWith(searchTerm)) return 1

          // Then by frequency
          return (counts[bLower] || 0) - (counts[aLower] || 0)
        })
        // Limit to 10 suggestions for performance
        .slice(0, 10)

      return filtered
    }, [currentValue, options])

    // Handle selection
    const handleSelect = (selected: string) => {
      if (multiple) {
        // For multiple values, replace the last part
        const parts = value.split(separator)
        parts[parts.length - 1] = selected
        onSelect(parts.join(`${separator} `))
      } else {
        onSelect(selected)
      }
      onOpenChange(false)
    }

    // Handle input change
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      onInputChange(e.target.value)
      if (e.target.value) {
        onOpenChange(true)
      }
    }

    // Handle keyboard navigation
    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Tab" && isOpen && filteredSortedOptions.length > 0) {
        e.preventDefault()
        handleSelect(filteredSortedOptions[0])
      }
    }

    return (
      <div className="relative w-full">
        <Input
          ref={ref}
          value={value}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className={className}
          onFocus={onFocus}
          onBlur={onBlur}
        />

        {isOpen && filteredSortedOptions.length > 0 && (
          <div className="absolute z-50 w-full left-0 top-[calc(100%+4px)]">
            <Command className="border border-gray-700 rounded-md bg-gray-800 shadow-md overflow-hidden">
              <CommandList className="max-h-[200px] overflow-y-auto">
                <CommandGroup>
                  {filteredSortedOptions.map((option) => (
                    <CommandItem
                      key={option}
                      value={option}
                      onSelect={() => handleSelect(option)}
                      className="cursor-pointer hover:bg-gray-700"
                    >
                      {option}
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </Command>
          </div>
        )}
      </div>
    )
  },
)

SimpleAutocomplete.displayName = "SimpleAutocomplete"
