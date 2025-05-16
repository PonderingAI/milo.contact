"use client"

import * as React from "react"
import { Check, ChevronsUpDown } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
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

    // Filter options based on current input
    const filteredOptions = React.useMemo(() => {
      // Only show suggestions after at least one character is typed
      if (!inputValue.trim() || inputValue.length < 1) return []

      const searchTerm = inputValue.toLowerCase()
      return options.filter((option) => option.toLowerCase().includes(searchTerm))
    }, [inputValue, options])

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
        onSelect(newValues.join(`${separator} `))
      } else {
        // For single selection
        onSelect(selectedValue)
      }

      setInputValue("")
      if (!multiple) setIsOpenState(false)
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
      <Popover open={isOpenState} onOpenChange={setIsOpenState}>
        <PopoverTrigger asChild>
          <div className="flex w-full relative">
            <Input
              ref={inputRef}
              value={multiple ? inputValue : activeValue}
              onChange={(e) => {
                handleInputChange(e)
                // Only open dropdown if there's text and options available
                if (e.target.value.trim().length >= 1) {
                  setIsOpenState(true)
                }
              }}
              onKeyDown={handleKeyDown}
              placeholder={placeholder}
              className={cn("w-full", className)}
              onClick={() => {
                // Only open if there's text
                if ((multiple ? inputValue : activeValue).trim().length >= 1) {
                  setIsOpenState(true)
                }
              }}
              onFocus={() => {
                // Only open if there's text
                if ((multiple ? inputValue : activeValue).trim().length >= 1) {
                  setIsOpenState(true)
                }
                onFocus?.()
              }}
              onBlur={() => {
                onBlur?.()
              }}
            />
            <Button
              variant="outline"
              role="combobox"
              aria-expanded={isOpenState}
              className="absolute right-0 px-3 focus:ring-0 focus:ring-offset-0"
              onClick={() => {
                // Only toggle if there's text
                if ((multiple ? inputValue : activeValue).trim().length >= 1) {
                  setIsOpenState(!isOpenState)
                }
              }}
              tabIndex={-1}
            >
              <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-50" />
            </Button>
          </div>
        </PopoverTrigger>
        <PopoverContent className="w-full p-0 border-t-0 rounded-t-none shadow-md" align="start" sideOffset={0}>
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
  },
)

SimpleAutocomplete.displayName = "SimpleAutocomplete"
