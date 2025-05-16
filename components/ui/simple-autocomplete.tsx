"use client"

import type React from "react"
import { useState, useEffect, useRef, forwardRef } from "react"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"

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
  isOpen?: boolean
  onOpenChange?: (isOpen: boolean) => void
  onFocus?: () => void
  onBlur?: () => void
}

export const SimpleAutocomplete = forwardRef<HTMLInputElement, SimpleAutocompleteProps>(
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
      isOpen: controlledIsOpen,
      onOpenChange,
      onFocus,
      onBlur,
    },
    ref,
  ) => {
    const [isOpen, setIsOpen] = useState(false)
    const [filteredOptions, setFilteredOptions] = useState<string[]>([])
    const [highlightedIndex, setHighlightedIndex] = useState(-1)
    const dropdownRef = useRef<HTMLDivElement>(null)
    const inputRef = useRef<HTMLInputElement>(null)

    // Use controlled or uncontrolled open state
    const open = controlledIsOpen !== undefined ? controlledIsOpen : isOpen
    const setOpen = (value: boolean) => {
      if (onOpenChange) onOpenChange(value)
      setIsOpen(value)
    }

    // Filter options based on input value
    useEffect(() => {
      if (!value.trim()) {
        setFilteredOptions(options)
        return
      }

      // For multiple values, only filter based on the current part being typed
      let currentInput = value
      if (multiple) {
        const parts = value.split(separator)
        currentInput = parts[parts.length - 1].trim()
      }

      // Filter options that include the current input (case insensitive)
      const filtered = options.filter((option) => option.toLowerCase().includes(currentInput.toLowerCase()))

      setFilteredOptions(filtered)
    }, [value, options, multiple, separator])

    // Handle keyboard navigation
    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "ArrowDown") {
        e.preventDefault()
        setHighlightedIndex((prev) => (prev < filteredOptions.length - 1 ? prev + 1 : 0))
        setOpen(true)
      } else if (e.key === "ArrowUp") {
        e.preventDefault()
        setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : filteredOptions.length - 1))
        setOpen(true)
      } else if (e.key === "Enter" && highlightedIndex >= 0) {
        e.preventDefault()
        handleOptionSelect(filteredOptions[highlightedIndex])
      } else if (e.key === "Escape") {
        setOpen(false)
      } else if (e.key === "Tab") {
        setOpen(false)
      }
    }

    const handleOptionSelect = (option: string) => {
      if (multiple) {
        const parts = value.split(separator)
        parts[parts.length - 1] = option
        const newValue = [...parts.slice(0, -1), option, ""].join(separator + " ")
        onSelect(newValue)
      } else {
        onSelect(option)
      }
      setOpen(false)
      setHighlightedIndex(-1)
      inputRef.current?.focus()
    }

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      onInputChange(e.target.value)
      if (!open) setOpen(true)
      setHighlightedIndex(-1)
    }

    const handleInputFocus = () => {
      if (onFocus) onFocus()
      setOpen(true)
    }

    const handleInputBlur = (e: React.FocusEvent<HTMLInputElement>) => {
      // Check if the related target is inside the dropdown
      if (dropdownRef.current?.contains(e.relatedTarget as Node)) {
        return
      }

      if (onBlur) onBlur()
    }

    // Close dropdown when clicking outside
    useEffect(() => {
      const handleClickOutside = (event: MouseEvent) => {
        if (
          dropdownRef.current &&
          !dropdownRef.current.contains(event.target as Node) &&
          inputRef.current &&
          !inputRef.current.contains(event.target as Node)
        ) {
          setOpen(false)
        }
      }

      document.addEventListener("mousedown", handleClickOutside)
      return () => {
        document.removeEventListener("mousedown", handleClickOutside)
      }
    }, [])

    return (
      <div className="relative">
        <Input
          ref={ref || inputRef}
          type="text"
          value={value}
          onChange={handleInputChange}
          onFocus={handleInputFocus}
          onBlur={handleInputBlur}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className={className}
          autoComplete="off"
        />
        {open && filteredOptions.length > 0 && (
          <div
            ref={dropdownRef}
            className="absolute z-50 w-full mt-1 bg-gray-900 border border-gray-700 rounded-md shadow-lg max-h-60 overflow-auto"
          >
            <ul className="py-1">
              {filteredOptions.map((option, index) => (
                <li
                  key={option}
                  onClick={() => handleOptionSelect(option)}
                  onMouseEnter={() => setHighlightedIndex(index)}
                  className={cn(
                    "px-3 py-2 cursor-pointer text-sm",
                    highlightedIndex === index ? "bg-gray-800 text-white" : "hover:bg-gray-800 text-gray-300",
                  )}
                >
                  {option}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    )
  },
)

SimpleAutocomplete.displayName = "SimpleAutocomplete"
