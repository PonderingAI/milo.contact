"use client"

import type React from "react"

import { useState, type KeyboardEvent } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { PlusCircle } from "lucide-react"
import type { Prompt } from "@/lib/types" // Import Prompt type

interface PromptInputProps {
  onAddPrompt: (text: string) => Prompt | undefined // Changed return type
  inputRef?: React.RefObject<HTMLInputElement>
}

export function PromptInput({ onAddPrompt, inputRef }: PromptInputProps) {
  const [text, setText] = useState("")

  const handleSubmit = () => {
    const newPromptObject = onAddPrompt(text) // Now receives the object
    if (newPromptObject) {
      setText("") // Clear input only if prompt was added
    }
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSubmit()
    }
  }

  return (
    <div className="flex gap-2 p-4 border-b border-brand-surface">
      <Input
        ref={inputRef}
        type="text"
        placeholder="Paste or type a new prompt... (Enter to add)"
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={handleKeyDown}
        className="flex-grow bg-brand-surface border-neutral-700 focus:ring-brand-accent focus:border-brand-accent text-brand-text placeholder:text-neutral-500"
      />
      <Button
        onClick={handleSubmit}
        variant="outline"
        className="border-brand-accent text-brand-accentText hover:bg-brand-accent hover:text-brand-background"
      >
        <PlusCircle className="w-4 h-4 mr-2" /> Add
      </Button>
    </div>
  )
}
