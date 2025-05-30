"use client"

import type React from "react"
import { useState, useEffect, useRef, type KeyboardEvent } from "react"
import { Input } from "@/components/ui/input"

interface QuickRatingInputProps {
  promptText: string
  currentRating: number
  onConfirmRating: (newRating: number) => void
  onCancel: () => void // Optional: if Esc should cancel
}

export function QuickRatingInput({ promptText, currentRating, onConfirmRating, onCancel }: QuickRatingInputProps) {
  const [ratingStr, setRatingStr] = useState(currentRating.toString())
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    inputRef.current?.focus()
    inputRef.current?.select() // Select current text for easy overwrite
  }, [])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    // Allow numbers, one decimal point, and up to 2 decimal places
    if (/^\d*\.?\d{0,2}$/.test(value) || value === "") {
      setRatingStr(value)
    }
  }

  const handleSubmit = () => {
    let newRating = Number.parseFloat(ratingStr)
    if (isNaN(newRating)) {
      newRating = currentRating // Or some default, or show error
    }
    newRating = Math.max(0, Math.min(10, newRating)) // Clamp between 0 and 10
    onConfirmRating(newRating)
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault()
      handleSubmit()
    } else if (e.key === "Escape") {
      e.preventDefault()
      if (onCancel) onCancel()
    }
  }

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-brand-surface p-6 rounded-lg shadow-xl w-full max-w-sm border border-brand-accent/50">
        <p className="text-sm text-neutral-400 mb-1">Rate prompt:</p>
        <p className="text-brand-text font-medium truncate mb-3" title={promptText}>
          {promptText}
        </p>
        <Input
          ref={inputRef}
          type="text" // Use text to allow decimal input easily
          value={ratingStr}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          placeholder="0-10 (e.g., 7.5)"
          className="text-center text-2xl font-bold bg-neutral-800 border-neutral-700 focus:ring-brand-accent focus:border-brand-accent text-brand-text placeholder:text-neutral-500 h-14"
          inputMode="decimal" // Hint for mobile keyboards
        />
        <p className="text-xs text-neutral-500 mt-3 text-center">Press Enter to confirm, Esc to cancel.</p>
      </div>
    </div>
  )
}
