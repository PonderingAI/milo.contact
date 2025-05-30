export interface Prompt {
  promptId: string
  text: string
  rating: number // 0-10
  notes?: string
  createdAt: string // ISO Date string
  updatedAt: string // ISO Date string
  tags?: string[]
  // Optional fields
  model?: string
  negativePrompt?: string
  category?: string
  aspectRatio?: string
  steps?: number
  seed?: number
  cfgScale?: number
}

export type OptionalPromptFields = Omit<Prompt, "promptId" | "text" | "rating" | "createdAt" | "updatedAt">
