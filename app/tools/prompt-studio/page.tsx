"use client"

import type React from "react"

import { useState, useRef, useEffect, useCallback } from "react"
import { PromptInput } from "@/components/prompt-input"
import { PromptList } from "@/components/prompt-list"
import { MetadataEditor } from "@/components/metadata-editor"
import { usePromptsStore } from "@/hooks/use-prompts-store"
import { useKeyboardShortcuts } from "@/hooks/use-keyboard-shortcuts"
import { Button } from "@/components/ui/button"
import { Download, Upload, Loader2, ArrowLeft } from "lucide-react"
import { cn } from "@/lib/utils"
import { QuickRatingInput } from "@/components/quick-rating-input"
import type { Prompt } from "@/lib/types"
import Link from "next/link"

export default function PromptStudioPage() {
  const {
    prompts,
    selectedPromptId,
    selectedPrompt,
    isLoading,
    addPrompt: addPromptToStore,
    updatePrompt,
    deletePrompt,
    selectPrompt,
    exportPrompts,
    importPrompts,
  } = usePromptsStore()

  const [activePanel, setActivePanel] = useState<"list" | "editor">("list")
  const [isRatingModeActive, setIsRatingModeActive] = useState(false)
  const [ratingTargetPrompt, setRatingTargetPrompt] = useState<Prompt | null>(null)

  const newPromptInputRef = useRef<HTMLInputElement>(null)
  const notesInputRef = useRef<HTMLTextAreaElement>(null)
  const promptListRef = useRef<HTMLUListElement>(null)
  const editorPanelRef = useRef<HTMLDivElement>(null)
  const importFileRef = useRef<HTMLInputElement>(null)

  const promptItemRefs = useRef<(HTMLLIElement | null)[]>([])
  useEffect(() => {
    promptItemRefs.current = promptItemRefs.current.slice(0, prompts.length)
  }, [prompts.length])

  const getItemRef = (index: number) => (element: HTMLLIElement | null) => {
    promptItemRefs.current[index] = element
  }

  const focusPromptListItem = useCallback(
    (id: string | null) => {
      if (!id) return
      const index = prompts.findIndex((p) => p.promptId === id)
      if (index !== -1 && promptItemRefs.current[index]) {
        promptItemRefs.current[index]?.focus()
      }
    },
    [prompts],
  )

  const handleNewPromptFocus = useCallback(() => {
    newPromptInputRef.current?.focus()
  }, [])

  const handleImportClick = () => {
    importFileRef.current?.click()
  }

  const handleFileImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      importPrompts(file)
    }
  }

  const handleSelectPrompt = useCallback(
    (id: string) => {
      selectPrompt(id)
      setActivePanel("editor")
    },
    [selectPrompt],
  )

  const navigatePrompts = (direction: "next" | "prev") => {
    if (prompts.length === 0) return
    const currentIndex = selectedPromptId ? prompts.findIndex((p) => p.promptId === selectedPromptId) : -1
    let nextIndex
    if (direction === "next") {
      nextIndex = currentIndex === -1 ? 0 : Math.min(prompts.length - 1, currentIndex + 1)
    } else {
      nextIndex = currentIndex === -1 ? prompts.length - 1 : Math.max(0, currentIndex - 1)
    }
    const nextPromptId = prompts[nextIndex]?.promptId
    if (nextPromptId) {
      selectPrompt(nextPromptId)
      focusPromptListItem(nextPromptId)
    }
  }

  const focusListPanel = useCallback(() => {
    setActivePanel("list")
    if (selectedPromptId) {
      focusPromptListItem(selectedPromptId)
    } else if (prompts.length > 0) {
      focusPromptListItem(prompts[0].promptId)
    }
  }, [selectedPromptId, prompts, focusPromptListItem])

  const focusEditorPanel = useCallback(() => {
    setActivePanel("editor")
    if (selectedPrompt && notesInputRef.current) {
      notesInputRef.current.focus()
    } else if (selectedPrompt && editorPanelRef.current) {
      editorPanelRef.current.focus()
    }
  }, [selectedPrompt])

  const handleAddNewPrompt = useCallback(
    (text: string) => {
      const newPromptObject = addPromptToStore(text)
      if (newPromptObject) {
        setRatingTargetPrompt(newPromptObject)
        setIsRatingModeActive(true)
        selectPrompt(newPromptObject.promptId)
      }
    },
    [addPromptToStore, selectPrompt],
  )

  const handleConfirmRating = useCallback(
    (newRating: number) => {
      if (ratingTargetPrompt) {
        updatePrompt(ratingTargetPrompt.promptId, { rating: newRating })
      }
      setIsRatingModeActive(false)
      setRatingTargetPrompt(null)
      setTimeout(() => newPromptInputRef.current?.focus(), 0)
    },
    [ratingTargetPrompt, updatePrompt],
  )

  const handleCancelRating = useCallback(() => {
    setIsRatingModeActive(false)
    setRatingTargetPrompt(null)
    setTimeout(() => newPromptInputRef.current?.focus(), 0)
  }, [])

  useKeyboardShortcuts({
    onNewPromptFocus: handleNewPromptFocus,
    onSave: exportPrompts,
    onImport: handleImportClick,
    onNextPrompt: () => !isRatingModeActive && navigatePrompts("next"),
    onPrevPrompt: () => !isRatingModeActive && navigatePrompts("prev"),
    onFocusList: () => !isRatingModeActive && focusListPanel(),
    onFocusEditor: () => !isRatingModeActive && focusEditorPanel(),
    canNavigatePrompts: activePanel === "list" && !isRatingModeActive,
  })

  useEffect(() => {
    if (isRatingModeActive) {
      return
    }

    if (activePanel === "list" && selectedPromptId) {
      focusPromptListItem(selectedPromptId)
    } else if (activePanel === "editor" && selectedPrompt && notesInputRef.current) {
      notesInputRef.current.focus()
    }
  }, [activePanel, selectedPromptId, selectedPrompt, focusPromptListItem, isRatingModeActive])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-brand-background">
        <Loader2 className="w-12 h-12 text-brand-accent animate-spin" />
        <p className="ml-4 text-xl font-serif text-brand-headline">Loading Prompts...</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-screen bg-brand-background text-brand-text overflow-hidden">
      <header className="p-3 border-b border-brand-surface flex justify-between items-center">
        <div className="flex items-center gap-4">
          <Button asChild variant="ghost" size="sm" className="text-brand-text hover:text-brand-accent">
            <Link href="/tools">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Tools
            </Link>
          </Button>
          <h1 className="text-3xl font-serif font-bold text-brand-headline">Prompt Studio</h1>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={exportPrompts}
            variant="outline"
            size="sm"
            className="border-brand-accent text-brand-accent hover:bg-brand-accent hover:text-brand-background"
          >
            <Download className="w-4 h-4 mr-2" /> Export All
          </Button>
          <Button
            onClick={handleImportClick}
            variant="outline"
            size="sm"
            className="border-brand-accent text-brand-accent hover:bg-brand-accent hover:text-brand-background"
          >
            <Upload className="w-4 h-4 mr-2" /> Import
          </Button>
          <input type="file" ref={importFileRef} onChange={handleFileImport} accept=".json" className="hidden" />
        </div>
      </header>

      <PromptInput onAddPrompt={handleAddNewPrompt} inputRef={newPromptInputRef} />

      <main className="flex flex-1 overflow-hidden">
        <aside
          data-panel="editor"
          className={cn(
            "w-1/3 border-r border-brand-surface overflow-y-auto transition-all duration-300 ease-in-out",
            activePanel === "editor" ? "ring-1 ring-brand-accent shadow-lg" : "opacity-75",
          )}
          onClick={() => !isRatingModeActive && setActivePanel("editor")}
        >
          <MetadataEditor
            prompt={selectedPrompt}
            onUpdatePrompt={updatePrompt}
            onDeletePrompt={deletePrompt}
            notesInputRef={notesInputRef}
            editorPanelRef={editorPanelRef}
          />
        </aside>

        <section
          data-panel="list"
          className={cn(
            "w-2/3 flex flex-col overflow-y-auto transition-all duration-300 ease-in-out",
            activePanel === "list" ? "ring-1 ring-brand-accent shadow-lg" : "opacity-75",
          )}
          onClick={() => !isRatingModeActive && setActivePanel("list")}
        >
          <PromptList
            prompts={prompts}
            selectedPromptId={selectedPromptId}
            onSelectPrompt={handleSelectPrompt}
            listRef={promptListRef}
            getItemRef={getItemRef}
          />
        </section>
      </main>
      <footer className="p-2 border-t border-brand-surface text-center text-xs text-neutral-500">
        Arrow keys to navigate prompts. Ctrl/Cmd+N for New, Ctrl/Cmd+S to Save, Ctrl/Cmd+O to Import. Tab/Arrows to
        switch panels.
      </footer>

      {isRatingModeActive && ratingTargetPrompt && (
        <QuickRatingInput
          promptText={ratingTargetPrompt.text}
          currentRating={ratingTargetPrompt.rating}
          onConfirmRating={handleConfirmRating}
          onCancel={handleCancelRating}
        />
      )}
    </div>
  )
}
