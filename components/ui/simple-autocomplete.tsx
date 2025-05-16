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
    const [inputValue, setInputValue] = React.useState(value)
    const [filteredOptions, setFilteredOptions] = React.useState<string[]>(options)

    // Use controlled open state if provided
    const isOpenState = isOpen !== undefined ? isOpen : open
    const setOpenState = (newOpen: boolean) => {
      setOpen(newOpen)
      onOpenChange?.(newOpen)
    }

    // For multiple values
    const values = React.useMemo(() => {
      if (!multiple) return [value]
      return value
        .split(separator)
        .map((v) => v.trim())
        .filter(Boolean)
    }, [value, multiple, separator])

    // Filter options based on input
    React.useEffect(() => {
      if (!inputValue.trim()) {
        setFilteredOptions(options)
        return
      }

      const searchTerm = inputValue.toLowerCase()
      const filtered = options.filter((option) => option.toLowerCase().includes(searchTerm))
      setFilteredOptions(filtered)
    }, [inputValue, options])

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
      if (!multiple) setOpenState(false)
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
      if (e.key === "Tab" && inputValue && filteredOptions.length > 0) {
        e.preventDefault()
        handleSelect(filteredOptions[0])
      }

      if (multiple && e.key === separator) {
        e.preventDefault()
        if (inputValue.trim()) {
          handleSelect(inputValue.trim())
        }
      }
    }

    return (
      <Popover open={isOpenState} onOpenChange={setOpenState}>
        <PopoverTrigger asChild>
          <div className="flex w-full relative">
            <Input
              ref={ref}
              value={inputValue}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              placeholder={placeholder}
              className={cn("w-full", className)}
              onClick={() => setOpenState(true)}
              onFocus={() => {
                onFocus?.()
                setOpenState(true)
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
              onClick={() => setOpenState(!isOpenState)}
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
                {filteredOptions.map((option) => (
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
