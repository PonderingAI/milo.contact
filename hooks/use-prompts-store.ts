"use client"

import { useState, useEffect, useCallback } from "react"
import type { Prompt } from "@/lib/types"
import { createPrompt, cleanObject, mergePrompts } from "@/lib/utils"

export function usePromptsStore() {
  const [prompts, setPrompts] = useState<Prompt[]>([])
  const [selectedPromptId, setSelectedPromptId] = useState<string | null>(null)
  const [isLoaded, setIsLoaded] = useState(false)
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)

  // Load prompts from sessionStorage on mount (not localStorage)
  useEffect(() => {
    const loadPrompts = () => {
      try {
        const savedPrompts = sessionStorage.getItem("prompts")
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
        console.error("Failed to load prompts from sessionStorage:", error)
        setIsLoaded(true)
      }
    }

    loadPrompts()
  }, [selectedPromptId])

  // Save prompts to sessionStorage whenever they change
  useEffect(() => {
    if (isLoaded && prompts.length > 0) {
      sessionStorage.setItem("prompts", JSON.stringify(prompts))
      setHasUnsavedChanges(true)
    }
  }, [prompts, isLoaded])

  // Add beforeunload event listener to warn about unsaved changes
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges && prompts.length > 0) {
        e.preventDefault()
        e.returnValue = "You have unsaved prompts. Are you sure you want to leave? Your data will be lost."
        return "You have unsaved prompts. Are you sure you want to leave? Your data will be lost."
      }
    }

    window.addEventListener("beforeunload", handleBeforeUnload)
    return () => window.removeEventListener("beforeunload", handleBeforeUnload)
  }, [hasUnsavedChanges, prompts.length])

  // Get the selected prompt
  const selectedPrompt = prompts.find((p) => p.promptId === selectedPromptId) || null

  // Add a new prompt
  const addPrompt = useCallback((text: string): Prompt | undefined => {
    if (!text.trim()) return undefined

    const newPrompt = createPrompt(text.trim())
    setPrompts((prev) => {
      const updated = [newPrompt, ...prev]
      console.log("Adding prompt:", newPrompt.promptId, "Total prompts:", updated.length)
      return updated
    })
    setSelectedPromptId(newPrompt.promptId)
    setHasUnsavedChanges(true) // Explicitly set this
    return newPrompt
  }, [])

  // Update a prompt
  const updatePrompt = useCallback((promptId: string, updates: Partial<Prompt>) => {
    setPrompts((prev) => {
      const updated = prev.map((p) => {
        if (p.promptId === promptId) {
          return {
            ...p,
            ...updates,
            updatedAt: new Date().toISOString(),
          }
        }
        return p
      })
      console.log("Updated prompt:", promptId, "Total prompts:", updated.length)
      return updated
    })
    setHasUnsavedChanges(true)
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

    // Mark as saved after export
    setHasUnsavedChanges(false)
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

  // Clear all data (for testing or reset)
  const clearAllData = useCallback(() => {
    setPrompts([])
    setSelectedPromptId(null)
    setHasUnsavedChanges(false)
    sessionStorage.removeItem("prompts")
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
    clearAllData,
    hasUnsavedChanges,
    isLoaded,
  }
}
