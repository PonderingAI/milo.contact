"use client"

import * as React from "react"
import { Check } from "lucide-react"
import { cn } from "@/lib/utils"
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
    const inputRef = React.useRef<HTMLInputElement>(null)
    const [filteredOptions, setFilteredOptions] = React.useState<string[]>([])
    const [highlightedIndex, setHighlightedIndex] = React.useState(-1)
    const [selectionComplete, setSelectionComplete] = React.useState(false)

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

    // Get the current tag being typed (for multiple mode)
    const getCurrentTag = React.useCallback(() => {
      if (!multiple) return value

      const lastSeparatorIndex = value.lastIndexOf(separator)
      if (lastSeparatorIndex >= 0) {
        return value.substring(lastSeparatorIndex + 1).trim()
      }
      return value.trim()
    }, [value, multiple, separator])

    // Determine if we should show suggestions
    const shouldShowSuggestions = filteredOptions.length > 0

    const handleSelect = (option: string) => {
      if (multiple) {
        // For multiple selection mode (tags)
        const lastTagIndex = value.lastIndexOf(separator)

        // Replace just the current tag being typed, not the entire value
        let newValue = ""
        if (lastTagIndex >= 0) {
          // Keep everything before the last separator, then add the selected option
          newValue = value.substring(0, lastTagIndex + 1) + " " + option
        } else {
          // No separator yet, just use the selected option
          newValue = option
        }

        // Add a separator at the end to prepare for the next tag
        newValue += separator + " "

        onInputChange(newValue)
        onSelect(newValue)
      } else {
        // For single selection mode
        onInputChange(option)
        onSelect(option)
      }

      // Clear suggestions and mark selection as complete
      setFilteredOptions([])
      setIsOpenState(false)
      setSelectionComplete(true)

      // Keep focus on the input
      inputRef.current?.focus()
    }

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const newValue = e.target.value

      // Reset selection complete flag when user types
      setSelectionComplete(false)

      onInputChange(newValue)

      // Auto-open dropdown if we have text
      if (getCurrentTag().length >= 1) {
        setIsOpenState(true)
      } else {
        setIsOpenState(false)
      }
    }

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
      // Reset selection complete flag on any key press except Tab
      if (e.key !== "Tab") {
        setSelectionComplete(false)
      }

      // Handle keyboard navigation
      if (e.key === "ArrowDown" && filteredOptions.length > 0) {
        e.preventDefault()
        setHighlightedIndex((prevIndex) => (prevIndex + 1) % filteredOptions.length)
      } else if (e.key === "ArrowUp" && filteredOptions.length > 0) {
        e.preventDefault()
        setHighlightedIndex((prevIndex) => (prevIndex - 1 + filteredOptions.length) % filteredOptions.length)
      } else if (e.key === "Enter" && highlightedIndex !== -1 && isOpenState) {
        e.preventDefault()
        handleSelect(filteredOptions[highlightedIndex])
      } else if (e.key === "Tab" && highlightedIndex !== -1 && isOpenState && !selectionComplete) {
        e.preventDefault()
        handleSelect(filteredOptions[highlightedIndex])
      } else if (e.key === "Escape") {
        setIsOpenState(false)
      }
    }

    // Forward the ref
    React.useImperativeHandle(ref, () => inputRef.current as HTMLInputElement)

    // Update filtered options when value changes
    React.useEffect(() => {
      // Skip filtering if selection was just completed
      if (selectionComplete) {
        return
      }

      const currentTag = getCurrentTag()

      // Only show suggestions if we have at least one character
      if (currentTag.length < 1) {
        setFilteredOptions([])
        return
      }

      // Filter options based on the current tag
      const filtered = options.filter((option) => option.toLowerCase().includes(currentTag.toLowerCase()))

      // Remove duplicates and already selected tags
      const selectedTags = multiple
        ? value
            .split(separator)
            .map((v) => v.trim())
            .filter(Boolean)
        : [value.trim()].filter(Boolean)

      const uniqueFiltered = [...new Set(filtered)].filter((option) => !selectedTags.includes(option))

      setFilteredOptions(uniqueFiltered)
      setHighlightedIndex(uniqueFiltered.length > 0 ? 0 : -1)

      // Only open dropdown if we have options and the input has focus
      if (uniqueFiltered.length > 0 && document.activeElement === inputRef.current) {
        setIsOpenState(true)
      } else {
        setIsOpenState(false)
      }
    }, [value, options, multiple, separator, getCurrentTag, selectionComplete])

    return (
      <div className="relative w-full">
        <Input
          ref={inputRef}
          value={value}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className={cn("w-full", className)}
          onFocus={() => {
            // Check if we should show suggestions on focus
            if (getCurrentTag().length >= 1) {
              setIsOpenState(true)
            }
            onFocus?.()
          }}
          onBlur={(e) => {
            // Delay closing to allow for selection
            setTimeout(() => {
              if (e.currentTarget && !e.currentTarget.contains(document.activeElement)) {
                setIsOpenState(false)
              }
            }, 100)
            onBlur?.()
          }}
        />

        {isOpenState && shouldShowSuggestions && (
          <div className="absolute z-50 w-full mt-1 bg-white dark:bg-gray-800 rounded-md border border-gray-200 dark:border-gray-700 shadow-lg">
            <div className="max-h-60 overflow-auto">
              <div className="py-1">
                {filteredOptions.map((option, index) => (
                  <div
                    key={option}
                    className={cn(
                      "px-2 py-1.5 text-sm cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center",
                      highlightedIndex === index && "bg-gray-200 dark:bg-gray-600",
                    )}
                    onClick={() => handleSelect(option)}
                  >
                    <Check className={cn("mr-2 h-4 w-4", values.includes(option) ? "opacity-100" : "opacity-0")} />
                    {option}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    )
  },
)

SimpleAutocomplete.displayName = "SimpleAutocomplete"
