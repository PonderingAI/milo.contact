"use client"

import React, { useState, useRef, useEffect } from "react"
import { Calendar } from "lucide-react"
import { Input } from "@/components/ui/input"

interface CustomDatePickerProps {
  value: string | null // Date string in YYYY-MM-DD format
  onChange: (date: string | null) => void
  placeholder?: string
  className?: string
  minDate?: string // Date string in YYYY-MM-DD format
  disabled?: boolean
}

export function CustomDatePicker({
  value,
  onChange,
  placeholder = "Select release date",
  className = "",
  minDate,
  disabled = false,
}: CustomDatePickerProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [currentMonth, setCurrentMonth] = useState<Date>(() => {
    if (value) {
      return new Date(value + 'T00:00:00')
    }
    return new Date()
  })

  const dropdownRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  // Format display value
  const formatDisplayValue = (dateStr: string | null): string => {
    if (!dateStr) return ""
    const date = new Date(dateStr + 'T00:00:00')
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    })
  }

  // Generate calendar days
  const generateCalendarDays = (month: Date): (Date | null)[] => {
    const year = month.getFullYear()
    const monthIndex = month.getMonth()
    
    const firstDay = new Date(year, monthIndex, 1)
    const lastDay = new Date(year, monthIndex + 1, 0)
    const startDate = new Date(firstDay)
    startDate.setDate(startDate.getDate() - firstDay.getDay())
    
    const days: (Date | null)[] = []
    
    for (let i = 0; i < 42; i++) {
      const currentDate = new Date(startDate)
      currentDate.setDate(startDate.getDate() + i)
      
      if (currentDate.getMonth() === monthIndex) {
        days.push(currentDate)
      } else {
        days.push(null)
      }
    }
    
    return days
  }

  const handleDateSelect = (date: Date) => {
    const dateStr = date.toISOString().split('T')[0]
    onChange(dateStr)
    setIsOpen(false)
  }

  const isDateDisabled = (date: Date): boolean => {
    if (!minDate) return false
    const minDateObj = new Date(minDate + 'T00:00:00')
    return date < minDateObj
  }

  const isSameDay = (date1: Date, date2: string): boolean => {
    const date2Obj = new Date(date2 + 'T00:00:00')
    return (
      date1.getDate() === date2Obj.getDate() &&
      date1.getMonth() === date2Obj.getMonth() &&
      date1.getFullYear() === date2Obj.getFullYear()
    )
  }

  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ]

  const weekDays = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"]

  const today = new Date().toISOString().split('T')[0]

  return (
    <div className="relative" ref={dropdownRef}>
      <div className="relative">
        <Input
          ref={inputRef}
          type="text"
          value={formatDisplayValue(value)}
          onChange={() => {}} // Read-only input
          onClick={() => !disabled && setIsOpen(!isOpen)}
          placeholder={placeholder}
          className={`pr-10 cursor-pointer ${className}`}
          readOnly
          disabled={disabled}
        />
        <Calendar className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
      </div>

      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-[#0f1520] border border-gray-700 rounded-lg shadow-lg z-50 p-4 min-w-[280px]">
          {/* Calendar Header */}
          <div className="flex items-center justify-between mb-4">
            <button
              type="button"
              onClick={() => {
                const newMonth = new Date(currentMonth)
                newMonth.setMonth(newMonth.getMonth() - 1)
                setCurrentMonth(newMonth)
              }}
              className="p-1 hover:bg-gray-700 rounded text-gray-300 hover:text-white"
            >
              ←
            </button>
            <h3 className="text-sm font-medium text-gray-200">
              {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
            </h3>
            <button
              type="button"
              onClick={() => {
                const newMonth = new Date(currentMonth)
                newMonth.setMonth(newMonth.getMonth() + 1)
                setCurrentMonth(newMonth)
              }}
              className="p-1 hover:bg-gray-700 rounded text-gray-300 hover:text-white"
            >
              →
            </button>
          </div>

          {/* Week days header */}
          <div className="grid grid-cols-7 gap-1 mb-2">
            {weekDays.map((day) => (
              <div key={day} className="text-xs text-gray-400 text-center p-1 font-medium">
                {day}
              </div>
            ))}
          </div>

          {/* Calendar days */}
          <div className="grid grid-cols-7 gap-1 mb-4">
            {generateCalendarDays(currentMonth).map((date, index) => (
              <button
                key={index}
                type="button"
                disabled={!date || isDateDisabled(date)}
                onClick={() => date && handleDateSelect(date)}
                className={`
                  text-xs p-2 rounded transition-colors disabled:cursor-not-allowed disabled:text-gray-600 disabled:hover:bg-transparent
                  ${date && value && isSameDay(date, value) 
                    ? "bg-blue-600 text-white hover:bg-blue-700" 
                    : "text-gray-200 hover:bg-gray-700"
                  }
                  ${!date ? "invisible" : ""}
                `}
              >
                {date?.getDate()}
              </button>
            ))}
          </div>

          {/* Quick actions */}
          <div className="border-t border-gray-700 pt-3 flex justify-between items-center">
            <button
              type="button"
              onClick={() => {
                onChange(today)
                setIsOpen(false)
              }}
              className="text-xs text-blue-400 hover:text-blue-300 transition-colors"
            >
              Today
            </button>
            <button
              type="button"
              onClick={() => {
                onChange(null)
                setIsOpen(false)
              }}
              className="text-xs text-gray-400 hover:text-gray-200 transition-colors"
            >
              Clear
            </button>
          </div>
        </div>
      )}
    </div>
  )
}