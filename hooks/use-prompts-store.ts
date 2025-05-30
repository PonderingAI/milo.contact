"use client"

import { useState, useEffect, useCallback } from "react"
import type { Prompt } from "@/lib/types"
import { createPrompt, cleanObject, mergePrompts } from "@/lib/utils"

export function usePromptsStore() {
  const [prompts, setPrompts] = useState<Prompt[]>([])
  const [selectedPromptId, setSelectedPromptId] = useState<string | null>(null)
  const [isLoaded, setIsLoaded] = useState(false)
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)

  // Load prompts from sessionStorage on mount ONLY
  useEffect(() => {
    const loadPrompts = () => {
      try {
        const savedPrompts = sessionStorage.getItem("prompts")
        console.log("Loading prompts from sessionStorage:", savedPrompts)

        if (savedPrompts) {
          const parsedPrompts = JSON.parse(savedPrompts) as Prompt[]
          console.log("Parsed prompts:", parsedPrompts.length)
          setPrompts(parsedPrompts)

          // Select the first prompt if available
          if (parsedPrompts.length > 0) {
            setSelectedPromptId(parsedPrompts[0].promptId)
          }
        } else {
          console.log("No saved prompts found")
          setPrompts([])
        }
        setIsLoaded(true)
      } catch (error) {
        console.error("Failed to load prompts from sessionStorage:", error)
        setPrompts([])
        setIsLoaded(true)
      }
    }

    loadPrompts()
  }, []) // Remove selectedPromptId dependency - only run on mount

  // Save prompts to sessionStorage whenever they change (but only after initial load)
  useEffect(() => {
    if (isLoaded) {
      if (prompts.length > 0) {
        console.log("Saving prompts to sessionStorage:", prompts.length)
        sessionStorage.setItem("prompts", JSON.stringify(prompts))
        setHasUnsavedChanges(true)
      } else {
        console.log("Clearing sessionStorage - no prompts")
        sessionStorage.removeItem("prompts")
        setHasUnsavedChanges(false)
      }
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
    if (!text.trim()) {
      console.log("Empty text, not adding prompt")
      return undefined
    }

    const newPrompt = createPrompt(text.trim())
    console.log("Creating new prompt:", newPrompt.promptId, newPrompt.text.substring(0, 50))

    setPrompts((prev) => {
      const updated = [newPrompt, ...prev]
      console.log("Updated prompts array length:", updated.length)
      return updated
    })

    setSelectedPromptId(newPrompt.promptId)
    console.log("Set selected prompt ID:", newPrompt.promptId)

    return newPrompt
  }, [])

  // Update a prompt
  const updatePrompt = useCallback((promptId: string, updates: Partial<Prompt>) => {
    console.log("Updating prompt:", promptId, updates)
    setPrompts((prev) => {
      const updated = prev.map((p) => {
        if (p.promptId === promptId) {
          const updatedPrompt = {
            ...p,
            ...updates,
            updatedAt: new Date().toISOString(),
          }
          console.log("Updated prompt:", updatedPrompt.promptId)
          return updatedPrompt
        }
        return p
      })
      console.log("Total prompts after update:", updated.length)
      return updated
    })
  }, [])

  // Delete a prompt
  const deletePrompt = useCallback(
    (promptId: string) => {
      console.log("Deleting prompt:", promptId)
      setPrompts((prev) => {
        const filtered = prev.filter((p) => p.promptId !== promptId)
        console.log("Prompts after deletion:", filtered.length)
        return filtered
      })

      // If the deleted prompt was selected, select another one
      if (selectedPromptId === promptId) {
        setSelectedPromptId((prev) => {
          const remainingPrompts = prompts.filter((p) => p.promptId !== promptId)
          const newSelected = remainingPrompts.length > 0 ? remainingPrompts[0].promptId : null
          console.log("New selected prompt after deletion:", newSelected)
          return newSelected
        })
      }
    },
    [prompts, selectedPromptId],
  )

  // Export prompts to JSON
  const exportPrompts = useCallback(() => {
    console.log("Exporting prompts:", prompts.length)
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
      console.log("Importing prompts:", importedPrompts.length)
      setPrompts((prev) => mergePrompts(prev, importedPrompts))
      return true
    } catch (error) {
      console.error("Failed to import prompts:", error)
      return false
    }
  }, [])

  // Clear all data (for testing or reset)
  const clearAllData = useCallback(() => {
    console.log("Clearing all data")
    setPrompts([])
    setSelectedPromptId(null)
    setHasUnsavedChanges(false)
    sessionStorage.removeItem("prompts")
  }, [])

  // Mark as saved (for external use, like after export)
  const markAsSaved = useCallback(() => {
    console.log("Marking as saved")
    setHasUnsavedChanges(false)
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
    markAsSaved,
    hasUnsavedChanges,
    isLoaded,
  }
}
