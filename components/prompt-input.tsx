"use client"

import { useState, useRef, type KeyboardEvent, type FormEvent } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

interface PromptInputProps {
  onAddPrompt: (text: string) => void
}

export function PromptInput({ onAddPrompt }: PromptInputProps) {
  const [text, setText] = useState("")
  const inputRef = useRef<HTMLInputElement>(null)

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    if (text.trim()) {
      onAddPrompt(text)
      setText("")
    }
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && text.trim()) {
      e.preventDefault()
      onAddPrompt(text)
      setText("")
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex items-center space-x-2 mb-4">
      <Input
        ref={inputRef}
        type="text"
        placeholder="Paste or type a new prompt..."
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={handleKeyDown}
        className="flex-1 bg-neutral-900 border-neutral-700 text-neutral-100 placeholder:text-neutral-500 focus:ring-offset-neutral-900 focus:ring-teal-800"
      />
      <Button
        type="submit"
        variant="outline"
        className="bg-neutral-800 border-neutral-700 text-neutral-100 hover:bg-neutral-700 hover:text-neutral-50"
      >
        Add
      </Button>
    </form>
  )
}
