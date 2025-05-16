"use client"

import * as React from "react"
import { Check, ChevronsUpDown } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
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

  // For multiple values
  const values = React.useMemo(() => {
    if (!multiple) return [value]
    return value
      .split(separator)
      .map((v) => v.trim())
      .filter(Boolean)
  }, [value, multiple, separator])

  // Sort options by frequency (assuming most used ones are duplicated in the array)
  const sortedOptions = React.useMemo(() => {
    const counts = options.reduce(
      (acc, curr) => {
        acc[curr] = (acc[curr] || 0) + 1
        return acc
      },
      {} as Record<string, number>,
    )

    return [...new Set(options)].sort((a, b) => (counts[b] || 0) - (counts[a] || 0))
  }, [options])

  // Filter options based on current input
  const filteredOptions = React.useMemo(() => {
    if (!inputValue.trim()) return sortedOptions

    const searchTerm = inputValue.toLowerCase()
    return sortedOptions.filter((option) => option.toLowerCase().includes(searchTerm))
  }, [inputValue, sortedOptions])

  // Sort filtered options to prioritize those that start with the input value
  const sortedFilteredOptions = React.useMemo(() => {
    if (!inputValue.trim()) return filteredOptions

    const searchTerm = inputValue.toLowerCase()
    return [...filteredOptions].sort((a, b) => {
      const aStartsWith = a.toLowerCase().startsWith(searchTerm)
      const bStartsWith = b.toLowerCase().startsWith(searchTerm)

      if (aStartsWith && !bStartsWith) return -1
      if (!aStartsWith && bStartsWith) return 1
      return a.localeCompare(b)
    })
  }, [filteredOptions, inputValue])

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
    if (!multiple) setOpen(false)
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value)
    if (allowCustomValues) {
      if (multiple) {
        // For multiple values, only update the current "active" value
        const parts = value.split(separator)
        parts[parts.length - 1] = e.target.value
        onChange(parts.join(`${separator} `))
      } else {
        onChange(e.target.value)
      }
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Tab" && inputValue && sortedFilteredOptions.length > 0) {
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
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <div className="flex w-full relative">
          <Input
            value={inputValue}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            className={cn("w-full", className)}
            onClick={() => setOpen(true)}
          />
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="absolute right-0 px-3 focus:ring-0 focus:ring-offset-0"
            onClick={() => setOpen(!open)}
            tabIndex={-1}
          >
            <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </div>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0" align="start">
        <Command>
          <CommandInput placeholder={placeholder} value={inputValue} onValueChange={setInputValue} />
          <CommandList>
            <CommandEmpty>{emptyMessage}</CommandEmpty>
            <CommandGroup className="max-h-60 overflow-auto">
              {sortedFilteredOptions.map((option) => (
                <CommandItem key={option} value={option} onSelect={() => handleSelect(option)}>
                  <Check className={cn("mr-2 h-4 w-4", values.includes(option) ? "opacity-100" : "opacity-0")} />
                  {option}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
