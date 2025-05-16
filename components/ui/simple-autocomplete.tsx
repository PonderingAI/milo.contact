"use client"

import * as React from "react"
import { Check } from "lucide-react"
import { cn } from "@/lib/utils"
import { Command, CommandEmpty, CommandGroup, CommandItem, CommandList } from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Input } from "@/components/ui/input"

interface SimpleAutocompleteProps {
  options: string[]
  value: string
  onInputChange: (value: string) => void
  onSelect: (value: string) => void
  placeholder?: string
  emptyMessage?: string
  className?: string
  allowCustomValues?: boolean
  multiple?: boolean
  separator?: string
  isOpen?: boolean
  onOpenChange?: (open: boolean) => void
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
      placeholder = "Search...",
      emptyMessage = "No results found.",
      className,
      allowCustomValues = true,
      multiple = false,
      separator = ",",
      isOpen,
      onOpenChange,
      onFocus,
      onBlur,
    },
    ref,
  ) => {
    const [open, setOpen] = React.useState(false)
    const [inputValue, setInputValue] = React.useState("")
    const [activeValue, setActiveValue] = React.useState(value)
    const inputRef = React.useRef<HTMLInputElement>(null)

    // Use controlled open state if provided
    const isOpenState = isOpen !== undefined ? isOpen : open
    const setIsOpenState = onOpenChange || setOpen

    // For multiple values
    const values = React.useMemo(() => {
      if (!multiple) return [value]
      return value
        .split(separator)
        .map((v) => v.trim())
        .filter(Boolean)
    }, [value, multiple, separator])

    // Filter options based on current input and remove duplicates
    const filteredOptions = React.useMemo(() => {
      // Only show suggestions after at least one character is typed
      if (!inputValue.trim() || inputValue.length < 1) return []

      const searchTerm = inputValue.toLowerCase()
      // Use Set to ensure unique options
      return [...new Set(options.filter((option) => option.toLowerCase().includes(searchTerm)))]
    }, [inputValue, options])

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
        onSelect(newValues.join(`${separator} `))
      } else {
        // For single selection
        onSelect(selectedValue)
      }

      setInputValue("")
      setIsOpenState(false)
    }

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const newValue = e.target.value
      setInputValue(newValue)

      if (allowCustomValues) {
        if (multiple) {
          // For multiple values, only update the current "active" value
          const parts = value.split(separator)
          parts[parts.length - 1] = newValue
          onInputChange(parts.join(`${separator} `))
        } else {
          onInputChange(newValue)
        }
      }

      // Auto-open dropdown if we have suggestions
      if (newValue.trim().length >= 1) {
        setIsOpenState(true)
      } else {
        setIsOpenState(false)
      }
    }

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Tab" && isOpenState && sortedFilteredOptions.length > 0) {
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

    // Update inputValue when value changes externally
    React.useEffect(() => {
      if (multiple) {
        const parts = value.split(separator)
        const lastPart = parts[parts.length - 1].trim()
        setInputValue(lastPart)
      } else {
        setActiveValue(value)
      }
    }, [value, multiple, separator])

    // Forward the ref
    React.useImperativeHandle(ref, () => inputRef.current as HTMLInputElement)

    return (
      <Popover open={isOpenState && shouldShowSuggestions} onOpenChange={setIsOpenState}>
        <PopoverTrigger asChild>
          <Input
            ref={inputRef}
            value={multiple ? inputValue : activeValue}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            className={cn("w-full", className)}
            onFocus={() => {
              if (shouldShowSuggestions) {
                setIsOpenState(true)
              }
              onFocus?.()
            }}
            onBlur={onBlur}
          />
        </PopoverTrigger>
        {shouldShowSuggestions && (
          <PopoverContent className="w-full p-0 border-t-0 rounded-t-none shadow-md" align="start" sideOffset={0}>
            <Command>
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
        )}
      </Popover>
    )
  },
)

SimpleAutocomplete.displayName = "SimpleAutocomplete"
