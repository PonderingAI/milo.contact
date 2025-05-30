"use client"

import { useState, useCallback, useEffect } from "react"
import type { Prompt } from "@/lib/types"
import { generateNewPrompt, cleanPromptForExport } from "@/lib/utils"

const LOCAL_STORAGE_KEY = "cinematicPrompts"

export function usePromptsStore() {
  const [prompts, setPrompts] = useState<Prompt[]>([])
  const [selectedPromptId, setSelectedPromptId] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    try {
      const storedPrompts = localStorage.getItem(LOCAL_STORAGE_KEY)
      if (storedPrompts) {
        setPrompts(JSON.parse(storedPrompts))
      }
    } catch (error) {
      console.error("Failed to load prompts from local storage:", error)
    }
    setIsLoading(false)
  }, [])

  useEffect(() => {
    if (!isLoading) {
      try {
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(prompts))
      } catch (error) {
        console.error("Failed to save prompts to local storage:", error)
      }
    }
  }, [prompts, isLoading])

  const addPrompt = useCallback((text: string): Prompt | undefined => {
    if (!text.trim()) return undefined
    const newPrompt = generateNewPrompt(text)
    setPrompts((prev) => [newPrompt, ...prev]) // Add to top
    // setSelectedPromptId(newPrompt.promptId) // Let the page component handle selection for rating flow
    return newPrompt // Return the full prompt object
  }, [])

  const updatePrompt = useCallback((promptId: string, updates: Partial<Prompt>) => {
    setPrompts((prev) =>
      prev.map((p) => (p.promptId === promptId ? { ...p, ...updates, updatedAt: new Date().toISOString() } : p)),
    )
  }, [])

  const deletePrompt = useCallback(
    (promptId: string) => {
      setPrompts((prev) => prev.filter((p) => p.promptId !== promptId))
      if (selectedPromptId === promptId) {
        setSelectedPromptId(null)
      }
    },
    [selectedPromptId],
  )

  const selectPrompt = useCallback((promptId: string | null) => {
    setSelectedPromptId(promptId)
  }, [])

  const selectedPrompt = prompts.find((p) => p.promptId === selectedPromptId) || null

  const exportPrompts = useCallback(() => {
    const sortedPrompts = [...prompts].sort((a, b) => b.rating - a.rating)
    const cleanedPrompts = sortedPrompts.map(cleanPromptForExport)
    const jsonString = JSON.stringify(cleanedPrompts, null, 2)

    // Create a blob and download link
    const blob = new Blob([jsonString], { type: "application/json" })
    const url = URL.createObjectURL(blob)

    // Create a download link and trigger it
    const link = document.createElement("a")
    link.href = url
    link.download = `prompts-${new Date().toISOString().split("T")[0]}.json`

    // Append to body, click, and clean up
    document.body.appendChild(link)
    link.click()

    // Small timeout before cleanup to ensure download starts
    setTimeout(() => {
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
    }, 100)
  }, [prompts])

  const importPrompts = useCallback((file: File) => {
    const reader = new FileReader()
    reader.onload = (event) => {
      try {
        const jsonString = event.target?.result as string
        const importedPrompts = JSON.parse(jsonString) as Prompt[]

        setPrompts((prevPrompts) => {
          const existingIds = new Set(prevPrompts.map((p) => p.promptId))
          const newPrompts = importedPrompts.filter((p) => !existingIds.has(p.promptId))
          const updatedPrompts = prevPrompts.map((existingP) => {
            const importedP = importedPrompts.find((p) => p.promptId === existingP.promptId)
            return importedP ? { ...existingP, ...importedP, updatedAt: new Date().toISOString() } : existingP
          })
          return [...updatedPrompts, ...newPrompts]
        })
      } catch (error) {
        console.error("Failed to import prompts:", error)
        alert("Error importing file. Please ensure it's a valid JSON export.")
      }
    }
    reader.readAsText(file)
  }, [])

  return {
    prompts,
    selectedPromptId,
    selectedPrompt,
    isLoading,
    addPrompt,
    updatePrompt,
    deletePrompt,
    selectPrompt,
    exportPrompts,
    importPrompts,
  }
}
