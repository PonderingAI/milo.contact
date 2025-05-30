"use client"

import type React from "react"

import type { Prompt } from "@/lib/types"
import { useEffect, useRef } from "react"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Slider } from "@/components/ui/slider"
import { Button } from "@/components/ui/button"
import { Trash2 } from "lucide-react"

interface MetadataEditorProps {
  prompt: Prompt | null
  onUpdatePrompt: (id: string, updates: Partial<Prompt>) => void
  onDeletePrompt: (id: string) => void
  notesInputRef?: React.RefObject<HTMLTextAreaElement>
  editorPanelRef?: React.RefObject<HTMLDivElement>
}

export function MetadataEditor({
  prompt,
  onUpdatePrompt,
  onDeletePrompt,
  notesInputRef,
  editorPanelRef,
}: MetadataEditorProps) {
  const internalNotesRef = useRef<HTMLTextAreaElement>(null)
  const combinedNotesRef = notesInputRef || internalNotesRef

  useEffect(() => {
    if (prompt && combinedNotesRef.current) {
      combinedNotesRef.current.focus()
      // Move cursor to end of notes
      const len = combinedNotesRef.current.value.length
      combinedNotesRef.current.setSelectionRange(len, len)
    }
  }, [prompt, combinedNotesRef])

  if (!prompt) {
    return (
      <div className="p-6 text-neutral-500 flex items-center justify-center h-full">
        Select a prompt to edit its metadata.
      </div>
    )
  }

  const handleChange = (field: keyof Prompt, value: any) => {
    onUpdatePrompt(prompt.promptId, { [field]: value })
  }

  const handleSliderChange = (value: number[]) => {
    handleChange("rating", value[0])
  }

  return (
    <div ref={editorPanelRef} className="p-6 space-y-6 bg-brand-surface h-full overflow-y-auto" tabIndex={-1}>
      <div>
        <h2 className="text-2xl font-serif mb-1 text-brand-headline">Edit Prompt</h2>
        <p className="text-xs text-neutral-400 truncate" title={prompt.text}>
          {prompt.text}
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="rating" className="text-brand-text">
          Rating: {prompt.rating.toFixed(1)}/10
        </Label>
        <Slider
          id="rating"
          min={0}
          max={10}
          step={0.1}
          value={[prompt.rating]}
          onValueChange={handleSliderChange}
          className="[&>span:first-child]:h-1 [&>span:first-child]:bg-brand-accent"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="notes" className="text-brand-text">
          Notes
        </Label>
        <Textarea
          id="notes"
          ref={combinedNotesRef}
          value={prompt.notes || ""}
          onChange={(e) => handleChange("notes", e.target.value)}
          placeholder="What worked, what to tweak..."
          className="min-h-[150px] bg-neutral-800 border-neutral-700 focus:ring-brand-accent focus:border-brand-accent text-brand-text placeholder:text-neutral-500"
        />
      </div>

      {/* Optional Fields Example */}
      <div className="space-y-2">
        <Label htmlFor="model" className="text-brand-text">
          Model (Optional)
        </Label>
        <Input
          id="model"
          value={prompt.model || ""}
          onChange={(e) => handleChange("model", e.target.value)}
          placeholder="e.g., stable-diffusion-2.1"
          className="bg-neutral-800 border-neutral-700 focus:ring-brand-accent focus:border-brand-accent text-brand-text placeholder:text-neutral-500"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="tags" className="text-brand-text">
          Tags (comma-separated)
        </Label>
        <Input
          id="tags"
          value={prompt.tags?.join(", ") || ""}
          onChange={(e) =>
            handleChange(
              "tags",
              e.target.value
                .split(",")
                .map((tag) => tag.trim())
                .filter((tag) => tag),
            )
          }
          placeholder="e.g., cinematic, portrait"
          className="bg-neutral-800 border-neutral-700 focus:ring-brand-accent focus:border-brand-accent text-brand-text placeholder:text-neutral-500"
        />
      </div>

      <div className="pt-4">
        <Button
          onClick={() => onDeletePrompt(prompt.promptId)}
          variant="destructive"
          className="w-full bg-red-700/20 border-red-700 text-red-400 hover:bg-red-700/30 hover:text-red-300"
        >
          <Trash2 className="w-4 h-4 mr-2" /> Delete Prompt
        </Button>
      </div>

      <div className="text-xs text-neutral-500 pt-4">
        <p>Created: {new Date(prompt.createdAt).toLocaleString()}</p>
        <p>Updated: {new Date(prompt.updatedAt).toLocaleString()}</p>
        <p className="truncate">ID: {prompt.promptId}</p>
      </div>
    </div>
  )
}
