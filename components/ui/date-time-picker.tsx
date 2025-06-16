"use client"

import React, { useState, useRef, useEffect } from "react"
import { Calendar, Clock } from "lucide-react"
import { Input } from "@/components/ui/input"

interface DateTimePickerProps {
  value: Date | null
  onChange: (date: Date | null) => void
  placeholder?: string
  className?: string
  minDate?: Date
  disabled?: boolean
}

export function DateTimePicker({
  value,
  onChange,
  placeholder = "Select date and time",
  className = "",
  minDate = new Date(),
  disabled = false,
}: DateTimePickerProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [selectedDate, setSelectedDate] = useState<Date>(value || new Date())
  const [currentMonth, setCurrentMonth] = useState<Date>(value || new Date())
  const [selectedHour, setSelectedHour] = useState<number>(value?.getHours() || 12)
  const [selectedMinute, setSelectedMinute] = useState<number>(value?.getMinutes() || 0)
  const [isPM, setIsPM] = useState<boolean>(value ? value.getHours() >= 12 : true)

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
  const formatDisplayValue = (date: Date | null): string => {
    if (!date) return ""
    return date.toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
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
    setSelectedDate(date)
    
    // Create final date with selected time
    const hour24 = isPM && selectedHour !== 12 ? selectedHour + 12 : !isPM && selectedHour === 12 ? 0 : selectedHour
    const finalDate = new Date(date)
    finalDate.setHours(hour24, selectedMinute, 0, 0)
    
    onChange(finalDate)
  }

  const handleTimeChange = () => {
    if (!value) return
    
    const hour24 = isPM && selectedHour !== 12 ? selectedHour + 12 : !isPM && selectedHour === 12 ? 0 : selectedHour
    const finalDate = new Date(value)
    finalDate.setHours(hour24, selectedMinute, 0, 0)
    
    onChange(finalDate)
  }

  const isDateDisabled = (date: Date): boolean => {
    return date < minDate
  }

  const isSameDay = (date1: Date, date2: Date): boolean => {
    return (
      date1.getDate() === date2.getDate() &&
      date1.getMonth() === date2.getMonth() &&
      date1.getFullYear() === date2.getFullYear()
    )
  }

  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ]

  const weekDays = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"]

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
        <div className="absolute top-full left-0 right-0 mt-1 bg-[#0f1520] border border-gray-800 rounded-md shadow-lg z-50 p-4">
          {/* Calendar Header */}
          <div className="flex items-center justify-between mb-4">
            <button
              type="button"
              onClick={() => {
                const newMonth = new Date(currentMonth)
                newMonth.setMonth(newMonth.getMonth() - 1)
                setCurrentMonth(newMonth)
              }}
              className="p-1 hover:bg-gray-700 rounded"
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
              className="p-1 hover:bg-gray-700 rounded"
            >
              →
            </button>
          </div>

          {/* Week days header */}
          <div className="grid grid-cols-7 gap-1 mb-2">
            {weekDays.map((day) => (
              <div key={day} className="text-xs text-gray-400 text-center p-1">
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
                  text-xs p-2 rounded hover:bg-gray-700 disabled:cursor-not-allowed disabled:text-gray-600
                  ${date && value && isSameDay(date, value) ? "bg-blue-600 text-white" : "text-gray-200"}
                  ${!date ? "invisible" : ""}
                `}
              >
                {date?.getDate()}
              </button>
            ))}
          </div>

          {/* Time picker */}
          <div className="border-t border-gray-700 pt-4">
            <div className="flex items-center gap-2 mb-2">
              <Clock className="h-4 w-4 text-gray-400" />
              <span className="text-sm text-gray-300">Time</span>
            </div>
            <div className="flex items-center gap-2">
              {/* Hour */}
              <select
                value={selectedHour}
                onChange={(e) => {
                  setSelectedHour(Number(e.target.value))
                  setTimeout(handleTimeChange, 0)
                }}
                className="bg-[#070a10] border border-gray-700 rounded px-2 py-1 text-sm text-gray-200"
              >
                {Array.from({ length: 12 }, (_, i) => i + 1).map((hour) => (
                  <option key={hour} value={hour}>
                    {hour.toString().padStart(2, "0")}
                  </option>
                ))}
              </select>
              <span className="text-gray-400">:</span>
              {/* Minute */}
              <select
                value={selectedMinute}
                onChange={(e) => {
                  setSelectedMinute(Number(e.target.value))
                  setTimeout(handleTimeChange, 0)
                }}
                className="bg-[#070a10] border border-gray-700 rounded px-2 py-1 text-sm text-gray-200"
              >
                {Array.from({ length: 4 }, (_, i) => i * 15).map((minute) => (
                  <option key={minute} value={minute}>
                    {minute.toString().padStart(2, "0")}
                  </option>
                ))}
              </select>
              {/* AM/PM */}
              <select
                value={isPM ? "PM" : "AM"}
                onChange={(e) => {
                  setIsPM(e.target.value === "PM")
                  setTimeout(handleTimeChange, 0)
                }}
                className="bg-[#070a10] border border-gray-700 rounded px-2 py-1 text-sm text-gray-200"
              >
                <option value="AM">AM</option>
                <option value="PM">PM</option>
              </select>
            </div>
          </div>

          {/* Clear button */}
          <div className="border-t border-gray-700 pt-3 mt-3">
            <button
              type="button"
              onClick={() => {
                onChange(null)
                setIsOpen(false)
              }}
              className="text-xs text-gray-400 hover:text-gray-200"
            >
              Clear selection
            </button>
          </div>
        </div>
      )}
    </div>
  )
}