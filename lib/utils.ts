import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { v4 as uuidv4 } from "uuid"
import type { Prompt, OptionalPromptFields } from "./types"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function generateNewPrompt(text: string): Prompt {
  const now = new Date().toISOString()
  return {
    promptId: uuidv4(),
    text,
    rating: 0,
    notes: "",
    createdAt: now,
    updatedAt: now,
    tags: [],
  }
}

export function cleanPromptForExport(prompt: Prompt): Partial<Prompt> {
  const cleanedPrompt: Partial<Prompt> = {
    promptId: prompt.promptId,
    text: prompt.text,
    rating: prompt.rating,
    createdAt: prompt.createdAt,
    updatedAt: prompt.updatedAt,
  }

  if (prompt.notes && prompt.notes.trim() !== "") {
    cleanedPrompt.notes = prompt.notes
  }
  if (prompt.tags && prompt.tags.length > 0) {
    cleanedPrompt.tags = prompt.tags
  }

  const optionalFields: (keyof OptionalPromptFields)[] = [
    "model",
    "negativePrompt",
    "category",
    "aspectRatio",
    "steps",
    "seed",
    "cfgScale",
  ]

  optionalFields.forEach((field) => {
    const value = prompt[field as keyof Prompt]
    if (value !== undefined && value !== null && (typeof value !== "string" || value.trim() !== "")) {
      ;(cleanedPrompt as any)[field] = value
    }
  })

  return cleanedPrompt
}
