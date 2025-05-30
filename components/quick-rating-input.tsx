"use client"

import { useState, useRef, useEffect, type KeyboardEvent } from "react"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"

interface QuickRatingInputProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (rating: number) => void
  initialRating?: number
}

export function QuickRatingInput({ isOpen, onClose, onSubmit, initialRating = 0 }: QuickRatingInputProps) {
  const [rating, setRating] = useState<string>(initialRating.toString())
  const inputRef = useRef<HTMLInputElement>(null)

  // Focus the input when the dialog opens
  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => {
        inputRef.current?.focus()
        inputRef.current?.select()
      }, 50)
    }
  }, [isOpen])

  const handleSubmit = () => {
    const parsedRating = Number.parseFloat(rating)
    if (!isNaN(parsedRating) && parsedRating >= 0 && parsedRating <= 10) {
      onSubmit(parsedRating)
      onClose()
    }
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault()
      handleSubmit()
    } else if (e.key === "Escape") {
      onClose()
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[300px] bg-neutral-900 border-neutral-800 text-neutral-100">
        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label htmlFor="quick-rating" className="text-neutral-300">
              Rating (0-10)
            </Label>
            <Input
              ref={inputRef}
              id="quick-rating"
              type="number"
              min="0"
              max="10"
              step="0.1"
              value={rating}
              onChange={(e) => setRating(e.target.value)}
              onKeyDown={handleKeyDown}
              className="bg-neutral-800 border-neutral-700 text-neutral-100 focus:ring-teal-800 focus:ring-offset-neutral-900"
            />
          </div>
          <div className="flex justify-end space-x-2">
            <Button
              variant="outline"
              onClick={onClose}
              className="bg-neutral-800 border-neutral-700 text-neutral-300 hover:bg-neutral-700"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              className="bg-neutral-800 border-neutral-700 text-teal-400 hover:bg-neutral-700 hover:text-teal-300"
            >
              Save
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
