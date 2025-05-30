"use client"

import { useState, useEffect, useCallback } from "react"
import type { Prompt } from "@/lib/types"
import { createPrompt, cleanObject, mergePrompts } from "@/lib/utils"

export function usePromptsStore() {
  const [prompts, setPrompts] = useState<Prompt[]>([])
  const [selectedPromptId, setSelectedPromptId] = useState<string | null>(null)
  const [isLoaded, setIsLoaded] = useState(false)

  // Load prompts from localStorage on mount
  useEffect(() => {
    const loadPrompts = () => {
      try {
        const savedPrompts = localStorage.getItem("prompts")
        if (savedPrompts) {
          const parsedPrompts = JSON.parse(savedPrompts) as Prompt[]
          setPrompts(parsedPrompts)

          // Select the first prompt if available
          if (parsedPrompts.length > 0 && !selectedPromptId) {
            setSelectedPromptId(parsedPrompts[0].promptId)
          }
        }
        setIsLoaded(true)
      } catch (error) {
        console.error("Failed to load prompts from localStorage:", error)
        setIsLoaded(true)
      }
    }

    loadPrompts()
  }, [selectedPromptId])

  // Save prompts to localStorage whenever they change
  useEffect(() => {
    if (isLoaded && prompts.length > 0) {
      localStorage.setItem("prompts", JSON.stringify(prompts))
    }
  }, [prompts, isLoaded])

  // Get the selected prompt
  const selectedPrompt = prompts.find((p) => p.promptId === selectedPromptId) || null

  // Add a new prompt
  const addPrompt = useCallback((text: string): Prompt | undefined => {
    if (!text.trim()) return undefined

    const newPrompt = createPrompt(text.trim())
    setPrompts((prev) => [newPrompt, ...prev])
    setSelectedPromptId(newPrompt.promptId)
    return newPrompt
  }, [])

  // Update a prompt
  const updatePrompt = useCallback((promptId: string, updates: Partial<Prompt>) => {
    setPrompts((prev) =>
      prev.map((p) => {
        if (p.promptId === promptId) {
          return {
            ...p,
            ...updates,
            updatedAt: new Date().toISOString(),
          }
        }
        return p
      }),
    )
  }, [])

  // Delete a prompt
  const deletePrompt = useCallback(
    (promptId: string) => {
      setPrompts((prev) => prev.filter((p) => p.promptId !== promptId))

      // If the deleted prompt was selected, select another one
      if (selectedPromptId === promptId) {
        setSelectedPromptId((prev) => {
          const remainingPrompts = prompts.filter((p) => p.promptId !== promptId)
          return remainingPrompts.length > 0 ? remainingPrompts[0].promptId : null
        })
      }
    },
    [prompts, selectedPromptId],
  )

  // Export prompts to JSON
  const exportPrompts = useCallback(() => {
    // Sort prompts by rating (descending)
    const sortedPrompts = [...prompts].sort((a, b) => b.rating - a.rating).map((prompt) => cleanObject(prompt))

    const json = JSON.stringify(sortedPrompts, null, 2)
    const blob = new Blob([json], { type: "application/json" })
    const url = URL.createObjectURL(blob)

    const a = document.createElement("a")
    a.href = url
    a.download = `prompts-export-${new Date().toISOString().slice(0, 10)}.json`
    document.body.appendChild(a)
    a.click()

    // Clean up
    setTimeout(() => {
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    }, 100)
  }, [prompts])

  // Import prompts from JSON
  const importPrompts = useCallback((jsonData: string) => {
    try {
      const importedPrompts = JSON.parse(jsonData) as Prompt[]
      setPrompts((prev) => mergePrompts(prev, importedPrompts))
      return true
    } catch (error) {
      console.error("Failed to import prompts:", error)
      return false
    }
  }, [])

  return {
    prompts,
    selectedPromptId,
    selectedPrompt,
    setSelectedPromptId,
    addPrompt,
    updatePrompt,
    deletePrompt,
    exportPrompts,
    importPrompts,
    isLoaded,
  }
}
