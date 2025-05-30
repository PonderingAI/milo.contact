import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { v4 as uuidv4 } from "uuid"
import type { Prompt, OptionalPromptFields } from "./types"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Generates a UUID v4
 */
export function generateUUID(): string {
  return uuidv4()
}

/**
 * Cleans an object by removing properties with null or undefined values
 */
export function cleanObject<T extends Record<string, any>>(obj: T): Partial<T> {
  return Object.entries(obj).reduce(
    (acc, [key, value]) => {
      if (value !== null && value !== undefined && value !== "") {
        if (Array.isArray(value) && value.length === 0) {
          return acc
        }
        acc[key as keyof T] = value
      }
      return acc
    },
    {} as Partial<T>,
  )
}

/**
 * Creates a new prompt with the given text and optional fields
 */
export function createPrompt(text: string, optionalFields: Partial<OptionalPromptFields> = {}): Prompt {
  const now = new Date().toISOString()

  return {
    promptId: generateUUID(),
    text,
    rating: 0,
    createdAt: now,
    updatedAt: now,
    ...optionalFields,
  }
}

/**
 * Format a date string to a more readable format
 */
export function formatDate(dateString: string): string {
  const date = new Date(dateString)
  return date.toLocaleString()
}

/**
 * Merges two arrays of prompts, preferring the newer version when duplicates exist
 */
export function mergePrompts(existingPrompts: Prompt[], newPrompts: Prompt[]): Prompt[] {
  const promptMap = new Map<string, Prompt>()

  // Add existing prompts to the map
  existingPrompts.forEach((prompt) => {
    promptMap.set(prompt.promptId, prompt)
  })

  // Add or update with new prompts
  newPrompts.forEach((prompt) => {
    const existing = promptMap.get(prompt.promptId)

    if (!existing || new Date(prompt.updatedAt) > new Date(existing.updatedAt)) {
      promptMap.set(prompt.promptId, prompt)
    }
  })

  return Array.from(promptMap.values())
}

/**
 * Extracts video information from a URL or other source
 * This function is required by the existing codebase
 */
export function extractVideoInfo(source: string): {
  url?: string
  provider?: string
  id?: string
  thumbnail?: string
  title?: string
} {
  // Default implementation that returns an empty object
  // You should replace this with your actual implementation if needed
  return {}
}

/**
 * Clean prompt for export by removing empty fields
 */
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

/**
 * Generate a new prompt with the given text
 */
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
