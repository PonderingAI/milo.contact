"use client"

import type React from "react"

import { useState, useCallback, useRef } from "react"
import Link from "next/link"
import { usePromptsStore } from "@/hooks/use-prompts-store"
import { useKeyboardShortcuts } from "@/hooks/use-keyboard-shortcuts"
import { PromptInput } from "@/components/prompt-input"
import { PromptList } from "@/components/prompt-list"
import { MetadataEditor } from "@/components/metadata-editor"
import { QuickRatingInput } from "@/components/quick-rating-input"
import { Button } from "@/components/ui/button"
import { cleanPromptForExport } from "@/lib/utils"
import type { Prompt } from "@/lib/types"
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
    hasUnsavedChanges,
  } = usePromptsStore()

  const [ratingTargetPrompt, setRatingTargetPrompt] = useState<Prompt | null>(null)
  const [activePanel, setActivePanel] = useState<"list" | "editor">("list")
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Handle adding a new prompt
  const handleAddNewPrompt = useCallback(
    (text: string) => {
      const newPrompt = addPromptToStore(text)
      if (newPrompt) {
        setRatingTargetPrompt(newPrompt)
      }
    },
    [addPromptToStore],
  )

  // Handle exporting prompts with simplified format
  const handleExport = useCallback(() => {
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
  }, [prompts])

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
            // Try to parse and convert the imported data
            const importedData = JSON.parse(content)

            // Convert from export format back to internal format if needed
            const convertedPrompts = importedData.map((item: any) => {
              if (item.prompt && !item.text) {
                // Convert from export format
                return {
                  ...item,
                  text: item.prompt,
                  promptId: crypto.randomUUID(),
                  createdAt: new Date().toISOString(),
                  updatedAt: new Date().toISOString(),
                }
              }
              return item
            })

            // For simplicity, replace all prompts with imported ones
            clearAllData()
            convertedPrompts.forEach((prompt: any) => {
              addPromptToStore(prompt.text || prompt.prompt)
              if (prompt.rating || prompt.notes || prompt.tags) {
                // Update with metadata after adding
                setTimeout(() => {
                  updatePrompt(prompt.promptId, {
                    rating: prompt.rating || 0,
                    notes: prompt.notes,
                    tags: prompt.tags,
                    model: prompt.model,
                    negativePrompt: prompt.negativePrompt,
                    category: prompt.category,
                    aspectRatio: prompt.aspectRatio,
                    steps: prompt.steps,
                    seed: prompt.seed,
                    cfgScale: prompt.cfgScale,
                  })
                }, 10)
              }
            })

            alert("Prompts imported successfully!")
          } catch (error) {
            alert("Failed to import prompts. Please check the file format.")
          }
        }
      }
      reader.readAsText(file)

      // Reset the input so the same file can be selected again
      e.target.value = ""
    },
    [addPromptToStore, updatePrompt, clearAllData],
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
        onClose={() => setRatingTargetPrompt(null)}
        onSubmit={(rating) => {
          if (ratingTargetPrompt) {
            updatePrompt(ratingTargetPrompt.promptId, { rating })
            setRatingTargetPrompt(null)

            // Focus back on the prompt input
            setTimeout(() => {
              const inputElement = document.querySelector('input[type="text"]') as HTMLInputElement
              if (inputElement) {
                inputElement.focus()
              }
            }, 10)
          }
        }}
        initialRating={ratingTargetPrompt?.rating || 0}
      />
    </div>
  )
}
