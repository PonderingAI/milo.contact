"use client"

import { useRef, useEffect } from "react"
import type { Prompt } from "@/lib/types"
import { Slider } from "@/components/ui/slider"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"

interface MetadataEditorProps {
  prompt: Prompt | null
  onUpdate: (promptId: string, updates: Partial<Prompt>) => void
  onDelete: (promptId: string) => void
}

export function MetadataEditor({ prompt, onUpdate, onDelete }: MetadataEditorProps) {
  const notesRef = useRef<HTMLTextAreaElement>(null)

  // Focus notes textarea when prompt changes
  useEffect(() => {
    if (prompt && notesRef.current) {
      notesRef.current.focus()
    }
  }, [prompt])

  if (!prompt) {
    return (
      <div className="h-full flex items-center justify-center p-4 text-neutral-400">
        <p>Select a prompt to edit its metadata</p>
      </div>
    )
  }

  const handleRatingChange = (value: number[]) => {
    onUpdate(prompt.promptId, { rating: value[0] })
  }

  const handleNotesChange = (notes: string) => {
    onUpdate(prompt.promptId, { notes })
  }

  const handleTagsChange = (tagsString: string) => {
    const tags = tagsString
      .split(",")
      .map((tag) => tag.trim())
      .filter((tag) => tag.length > 0)

    onUpdate(prompt.promptId, { tags })
  }

  const handleDelete = () => {
    if (window.confirm("Are you sure you want to delete this prompt?")) {
      onDelete(prompt.promptId)
    }
  }

  return (
    <ScrollArea className="h-full">
      <div className="p-4 space-y-6">
        <div>
          <h3 className="font-serif text-xl text-neutral-100 mb-4">Metadata Editor</h3>
        </div>

        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <Label htmlFor="rating" className="text-neutral-300">
              Rating ({prompt.rating.toFixed(1)})
            </Label>
          </div>
          <Slider
            id="rating"
            min={0}
            max={10}
            step={0.1}
            value={[prompt.rating]}
            onValueChange={handleRatingChange}
            className="py-4"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="notes" className="text-neutral-300">
            Notes
          </Label>
          <Textarea
            ref={notesRef}
            id="notes"
            placeholder="What worked, what to tweak..."
            value={prompt.notes || ""}
            onChange={(e) => handleNotesChange(e.target.value)}
            className="min-h-[100px] bg-neutral-900 border-neutral-700 text-neutral-100 focus:ring-teal-800 focus:ring-offset-neutral-900"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="tags" className="text-neutral-300">
            Tags (comma-separated)
          </Label>
          <Input
            id="tags"
            placeholder="cinematic, portrait, etc."
            value={prompt.tags?.join(", ") || ""}
            onChange={(e) => handleTagsChange(e.target.value)}
            className="bg-neutral-900 border-neutral-700 text-neutral-100 focus:ring-teal-800 focus:ring-offset-neutral-900"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="model" className="text-neutral-300">
            Model
          </Label>
          <Input
            id="model"
            placeholder="stable-diffusion-2.1"
            value={prompt.model || ""}
            onChange={(e) => onUpdate(prompt.promptId, { model: e.target.value })}
            className="bg-neutral-900 border-neutral-700 text-neutral-100 focus:ring-teal-800 focus:ring-offset-neutral-900"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="negativePrompt" className="text-neutral-300">
            Negative Prompt
          </Label>
          <Textarea
            id="negativePrompt"
            placeholder="lowres, blurry, etc."
            value={prompt.negativePrompt || ""}
            onChange={(e) => onUpdate(prompt.promptId, { negativePrompt: e.target.value })}
            className="min-h-[80px] bg-neutral-900 border-neutral-700 text-neutral-100 focus:ring-teal-800 focus:ring-offset-neutral-900"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="category" className="text-neutral-300">
              Category
            </Label>
            <Input
              id="category"
              placeholder="experiments"
              value={prompt.category || ""}
              onChange={(e) => onUpdate(prompt.promptId, { category: e.target.value })}
              className="bg-neutral-900 border-neutral-700 text-neutral-100 focus:ring-teal-800 focus:ring-offset-neutral-900"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="aspectRatio" className="text-neutral-300">
              Aspect Ratio
            </Label>
            <Input
              id="aspectRatio"
              placeholder="16:9"
              value={prompt.aspectRatio || ""}
              onChange={(e) => onUpdate(prompt.promptId, { aspectRatio: e.target.value })}
              className="bg-neutral-900 border-neutral-700 text-neutral-100 focus:ring-teal-800 focus:ring-offset-neutral-900"
            />
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label htmlFor="steps" className="text-neutral-300">
              Steps
            </Label>
            <Input
              id="steps"
              type="number"
              placeholder="50"
              value={prompt.steps || ""}
              onChange={(e) => onUpdate(prompt.promptId, { steps: Number.parseInt(e.target.value) || undefined })}
              className="bg-neutral-900 border-neutral-700 text-neutral-100 focus:ring-teal-800 focus:ring-offset-neutral-900"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="seed" className="text-neutral-300">
              Seed
            </Label>
            <Input
              id="seed"
              type="number"
              placeholder="123456789"
              value={prompt.seed || ""}
              onChange={(e) => onUpdate(prompt.promptId, { seed: Number.parseInt(e.target.value) || undefined })}
              className="bg-neutral-900 border-neutral-700 text-neutral-100 focus:ring-teal-800 focus:ring-offset-neutral-900"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="cfgScale" className="text-neutral-300">
              CFG Scale
            </Label>
            <Input
              id="cfgScale"
              type="number"
              step="0.1"
              placeholder="7.5"
              value={prompt.cfgScale || ""}
              onChange={(e) => onUpdate(prompt.promptId, { cfgScale: Number.parseFloat(e.target.value) || undefined })}
              className="bg-neutral-900 border-neutral-700 text-neutral-100 focus:ring-teal-800 focus:ring-offset-neutral-900"
            />
          </div>
        </div>

        <div className="pt-4">
          <Button
            variant="destructive"
            onClick={handleDelete}
            className="w-full bg-red-900/30 hover:bg-red-900/50 text-red-300"
          >
            Delete Prompt
          </Button>
        </div>
      </div>
    </ScrollArea>
  )
}
