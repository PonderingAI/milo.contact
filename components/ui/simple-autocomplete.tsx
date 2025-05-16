"use client"

import * as React from "react"
import { CommandList, CommandGroup, CommandItem, CommandEmpty, Command } from "@/components/ui/command"

interface SimpleAutocompleteProps {
  inputRef: React.RefObject<HTMLInputElement>
  options: string[]
  value: string
  onChange: (value: string) => void
  onSelect: (value: string) => void
  isOpen: boolean
  setIsOpen: (open: boolean) => void
  isMultiple?: boolean
  separator?: string
}

export function SimpleAutocomplete({
  inputRef,
  options,
  value,
  onChange,
  onSelect,
  isOpen,
  setIsOpen,
  isMultiple = false,
  separator = ",",
}: SimpleAutocompleteProps) {
  // Get current input value
  const currentValue = isMultiple ? value.split(separator).pop()?.trim() || "" : value

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
    if (isMultiple) {
      // For multiple values, replace the last part
      const parts = value.split(separator)
      parts[parts.length - 1] = selected
      onSelect(parts.join(`${separator} `))
    } else {
      onSelect(selected)
    }
    setIsOpen(false)
    inputRef.current?.focus()
  }

  // If no suggestions or if input is empty, don't show the dropdown
  if (filteredSortedOptions.length === 0 || !currentValue) {
    return null
  }

  return (
    <div className="absolute z-50 w-full left-0 top-[calc(100%+4px)]">
      <Command className="border border-gray-700 rounded-md bg-gray-800 shadow-md overflow-hidden">
        <CommandList className="max-h-[200px] overflow-y-auto">
          {filteredSortedOptions.length === 0 ? (
            <CommandEmpty>No results found</CommandEmpty>
          ) : (
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
          )}
        </CommandList>
      </Command>
    </div>
  )
}
