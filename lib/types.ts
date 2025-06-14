export interface Prompt {
  promptId: string
  text: string
  rating: number
  notes?: string
  createdAt: string
  updatedAt: string
  tags?: string[]
  model?: string
  negativePrompt?: string
  category?: string
  aspectRatio?: string
  steps?: number
  seed?: number
  cfgScale?: number
}

export type OptionalPromptFields = Omit<Prompt, "promptId" | "text" | "rating" | "createdAt" | "updatedAt">

// Export format for JSON - simplified structure
export interface ExportPrompt {
  prompt: string
  rating: number
  notes?: string
  tags?: string[]
  model?: string
  negativePrompt?: string
  category?: string
  aspectRatio?: string
  steps?: number
  seed?: number
  cfgScale?: number
}
