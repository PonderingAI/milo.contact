"use client"

import type React from "react"

import { useState, useCallback, useRef, useEffect } from "react"
import Link from "next/link"
import { usePromptsStore } from "@/hooks/use-prompts-store"
import { useKeyboardShortcuts } from "@/hooks/use-keyboard-shortcuts"
import { PromptInput } from "@/components/prompt-input"
import { PromptList } from "@/components/prompt-list"
import { MetadataEditor } from "@/components/metadata-editor"
import { QuickRatingInput } from "@/components/quick-rating-input"
import { Button } from "@/components/ui/button"
import { cleanPromptForExport } from "@/lib/utils"
import type { Prompt, ExportPrompt } from "@/lib/types"
import { ArrowLeft, Save, Upload, Plus, Trash2 } from "lucide-react"

export default function PromptStudioPage() {
  const {
    prompts,
    selectedPromptId,
    selectedPrompt,
    setSelectedPromptId,
    addPrompt: addPromptToStore,
    updatePrompt,
    deletePrompt,
    clearAllData,
    markAsSaved,
    hasUnsavedChanges,
    isLoaded,
  } = usePromptsStore()

  const [ratingTargetPrompt, setRatingTargetPrompt] = useState<Prompt | null>(null)
  const [activePanel, setActivePanel] = useState<"list" | "editor">("list")
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Debug effect to log prompts changes
  useEffect(() => {
    console.log(
      "Prompts changed:",
      prompts.length,
      prompts.map((p) => ({ id: p.promptId, text: p.text.substring(0, 30) })),
    )
  }, [prompts])

  // Handle adding a new prompt
  const handleAddNewPrompt = useCallback(
    (text: string) => {
      console.log("handleAddNewPrompt called with:", text)

      if (!text.trim()) {
        console.log("Empty text, not adding")
        return
      }

      const newPrompt = addPromptToStore(text.trim())
      console.log("addPromptToStore returned:", newPrompt)

      if (newPrompt) {
        // Use a longer timeout to ensure the prompt is fully added to state
        setTimeout(() => {
          console.log("Setting rating target prompt:", newPrompt.promptId)
          setRatingTargetPrompt(newPrompt)
        }, 100)
      } else {
        console.log("No prompt was created")
      }
    },
    [addPromptToStore],
  )

  // Handle exporting prompts with simplified format
  const handleExport = useCallback(() => {
    console.log("Exporting prompts, count:", prompts.length)
    // Sort prompts by rating (descending) and clean for export
    const sortedPrompts = [...prompts].sort((a, b) => b.rating - a.rating).map((prompt) => cleanPromptForExport(prompt))

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

    // Mark as saved after successful export
    markAsSaved()
    console.log("Export completed, marked as saved")
  }, [prompts, markAsSaved])

  // Handle importing prompts
  const handleImport = useCallback(() => {
    fileInputRef.current?.click()
  }, [])

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]
      if (!file) return

      const reader = new FileReader()
      reader.onload = (event) => {
        const content = event.target?.result as string
        if (content) {
          try {
            console.log("Importing file content:", content.substring(0, 200))
            const importedData = JSON.parse(content) as ExportPrompt[]
            console.log("Parsed imported data:", importedData)

            if (!Array.isArray(importedData)) {
              throw new Error("Invalid format: expected an array of prompts")
            }

            const existingTexts = new Set(prompts.map((p) => p.text.toLowerCase().trim()))
            let addedCount = 0
            let skippedCount = 0

            // Process each imported prompt
            importedData.forEach((exportPrompt, index) => {
              console.log(`Processing import ${index + 1}:`, exportPrompt)

              // Get the prompt text (could be 'prompt' or 'text' field)
              const promptText = exportPrompt.prompt || (exportPrompt as any).text
              if (!promptText) {
                console.warn("Skipping prompt without text:", exportPrompt)
                skippedCount++
                return
              }

              // Check if this prompt already exists (case-insensitive)
              const normalizedText = promptText.toLowerCase().trim()
              if (existingTexts.has(normalizedText)) {
                console.log("Skipping duplicate prompt:", promptText.substring(0, 50))
                skippedCount++
                return
              }

              // Add the prompt first
              const newPrompt = addPromptToStore(promptText)
              console.log("Added prompt:", newPrompt?.promptId)

              if (newPrompt) {
                addedCount++
                existingTexts.add(normalizedText) // Track this new prompt to avoid duplicates within the import

                // Prepare metadata updates
                const metadata: Partial<Prompt> = {}

                if (exportPrompt.rating !== undefined && exportPrompt.rating !== null) {
                  metadata.rating = exportPrompt.rating
                }
                if (exportPrompt.notes) {
                  metadata.notes = exportPrompt.notes
                }
                if (exportPrompt.tags && Array.isArray(exportPrompt.tags)) {
                  metadata.tags = exportPrompt.tags
                }
                if (exportPrompt.model) {
                  metadata.model = exportPrompt.model
                }
                if (exportPrompt.negativePrompt) {
                  metadata.negativePrompt = exportPrompt.negativePrompt
                }
                if (exportPrompt.category) {
                  metadata.category = exportPrompt.category
                }
                if (exportPrompt.aspectRatio) {
                  metadata.aspectRatio = exportPrompt.aspectRatio
                }
                if (exportPrompt.steps !== undefined && exportPrompt.steps !== null) {
                  metadata.steps = exportPrompt.steps
                }
                if (exportPrompt.seed !== undefined && exportPrompt.seed !== null) {
                  metadata.seed = exportPrompt.seed
                }
                if (exportPrompt.cfgScale !== undefined && exportPrompt.cfgScale !== null) {
                  metadata.cfgScale = exportPrompt.cfgScale
                }

                // Update with metadata if there's any
                if (Object.keys(metadata).length > 0) {
                  console.log("Updating prompt with metadata:", newPrompt.promptId, metadata)
                  // Use setTimeout to ensure the prompt is fully added before updating
                  setTimeout(
                    () => {
                      updatePrompt(newPrompt.promptId, metadata)
                    },
                    50 * (index + 1),
                  ) // Stagger updates to avoid race conditions
                }
              }
            })

            console.log(`Import completed: ${addedCount} added, ${skippedCount} skipped (duplicates)`)
          } catch (error) {
            console.error("Import error:", error)
            alert("Failed to import prompts. Please check the file format.")
          }
        }
      }
      reader.readAsText(file)

      // Reset the input so the same file can be selected again
      e.target.value = ""
    },
    [addPromptToStore, updatePrompt, prompts],
  )

  // Handle clearing all data
  const handleClearAll = useCallback(() => {
    if (window.confirm("Are you sure you want to clear all prompts? This action cannot be undone.")) {
      clearAllData()
    }
  }, [clearAllData])

  // Keyboard shortcuts
  useKeyboardShortcuts(
    {
      "ctrl+n": () => {
        const inputElement = document.querySelector('input[type="text"]') as HTMLInputElement
        if (inputElement) {
          inputElement.focus()
        }
      },
      "ctrl+s": handleExport,
      "ctrl+o": handleImport,
      arrowup: () => {
        if (activePanel === "list" && selectedPromptId) {
          const currentIndex = prompts.findIndex((p) => p.promptId === selectedPromptId)
          if (currentIndex > 0) {
            setSelectedPromptId(prompts[currentIndex - 1].promptId)
          }
        }
      },
      arrowdown: () => {
        if (activePanel === "list" && selectedPromptId) {
          const currentIndex = prompts.findIndex((p) => p.promptId === selectedPromptId)
          if (currentIndex < prompts.length - 1) {
            setSelectedPromptId(prompts[currentIndex + 1].promptId)
          }
        }
      },
      arrowright: () => {
        if (activePanel === "list" && selectedPrompt) {
          setActivePanel("editor")
          // Focus the notes textarea
          setTimeout(() => {
            const notesTextarea = document.querySelector("textarea#notes") as HTMLTextAreaElement
            if (notesTextarea) {
              notesTextarea.focus()
            }
          }, 10)
        }
      },
      arrowleft: () => {
        if (activePanel === "editor") {
          setActivePanel("list")
          // Focus the selected prompt
          setTimeout(() => {
            const selectedElement = document.querySelector(`[data-prompt-id="${selectedPromptId}"]`) as HTMLElement
            if (selectedElement) {
              selectedElement.focus()
            }
          }, 10)
        }
      },
      tab: () => {
        setActivePanel((prev) => (prev === "list" ? "editor" : "list"))
      },
      "shift+tab": () => {
        setActivePanel((prev) => (prev === "editor" ? "list" : "editor"))
      },
    },
    [prompts, selectedPromptId, selectedPrompt, activePanel, handleExport],
    !!ratingTargetPrompt, // Disable keyboard shortcuts when rating modal is open
  )

  // Show loading state
  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-black text-neutral-100 flex items-center justify-center">
        <div>Loading...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black text-neutral-100 flex flex-col">
      <header className="border-b border-neutral-800 p-4">
        <div className="container mx-auto flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <Link href="/tools" className="text-neutral-400 hover:text-neutral-100 transition-colors">
              <ArrowLeft className="h-5 w-5" />
              <span className="sr-only">Back to Tools</span>
            </Link>
            <h1 className="font-serif text-2xl">Prompt Studio</h1>
            {hasUnsavedChanges && <span className="text-yellow-400 text-sm">● Unsaved changes</span>}
            <span className="text-neutral-500 text-sm">({prompts.length} prompts)</span>
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleImport}
              className="bg-neutral-900 border-neutral-800 text-neutral-300 hover:bg-neutral-800"
            >
              <Upload className="h-4 w-4 mr-2" />
              Import
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleExport}
              disabled={prompts.length === 0}
              className="bg-neutral-900 border-neutral-800 text-neutral-300 hover:bg-neutral-800 disabled:opacity-50"
            >
              <Save className="h-4 w-4 mr-2" />
              Export
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleClearAll}
              disabled={prompts.length === 0}
              className="bg-red-900/30 border-red-800 text-red-300 hover:bg-red-900/50 disabled:opacity-50"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Clear All
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                const inputElement = document.querySelector('input[type="text"]') as HTMLInputElement
                if (inputElement) {
                  inputElement.focus()
                }
              }}
              className="bg-neutral-900 border-neutral-800 text-neutral-300 hover:bg-neutral-800"
            >
              <Plus className="h-4 w-4 mr-2" />
              New (Ctrl+N)
            </Button>
          </div>
        </div>
      </header>

      <div className="container mx-auto p-4 flex-1 flex flex-col">
        <PromptInput onAddPrompt={handleAddNewPrompt} />

        <div className="flex-1 flex gap-4 h-[calc(100vh-180px)]">
          <div className="w-1/3 bg-neutral-900 border border-neutral-800 rounded-md overflow-hidden">
            <MetadataEditor prompt={selectedPrompt} onUpdate={updatePrompt} onDelete={deletePrompt} />
          </div>
          <div className="w-2/3 bg-neutral-900 border border-neutral-800 rounded-md overflow-hidden">
            <PromptList
              prompts={prompts}
              selectedPromptId={selectedPromptId}
              onSelectPrompt={(id) => {
                setSelectedPromptId(id)
                setActivePanel("editor")
              }}
            />
          </div>
        </div>
      </div>

      {/* Hidden file input for importing */}
      <input type="file" ref={fileInputRef} onChange={handleFileChange} accept=".json" className="hidden" />

      {/* Quick rating modal */}
      <QuickRatingInput
        isOpen={!!ratingTargetPrompt}
        onClose={() => {
          console.log("Closing rating modal")
          setRatingTargetPrompt(null)
        }}
        onSubmit={(rating) => {
          console.log("Submitting rating:", rating, "for prompt:", ratingTargetPrompt?.promptId)
          if (ratingTargetPrompt) {
            updatePrompt(ratingTargetPrompt.promptId, { rating })
            setRatingTargetPrompt(null)

            // Focus back on the prompt input
            setTimeout(() => {
              const inputElement = document.querySelector('input[type="text"]') as HTMLInputElement
              if (inputElement) {
                inputElement.focus()
              }
            }, 100)
          }
        }}
        initialRating={ratingTargetPrompt?.rating || 0}
      />
    </div>
  )
}
