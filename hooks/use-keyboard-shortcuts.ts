"use client"

import { useEffect, useCallback } from "react"

interface UseKeyboardShortcutsProps {
  onNewPromptFocus: () => void
  onSave: () => void
  onImport: () => void
  onNextPrompt: () => void
  onPrevPrompt: () => void
  onFocusList: () => void
  onFocusEditor: () => void
  canNavigatePrompts: boolean // True if prompt list has focus or is active
}

export function useKeyboardShortcuts({
  onNewPromptFocus,
  onSave,
  onImport,
  onNextPrompt,
  onPrevPrompt,
  onFocusList,
  onFocusEditor,
  canNavigatePrompts,
}: UseKeyboardShortcutsProps) {
  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      const target = event.target as HTMLElement
      const isEditingText = target.tagName === "INPUT" || target.tagName === "TEXTAREA"

      // Global shortcuts
      if (event.ctrlKey || event.metaKey) {
        switch (event.key.toLowerCase()) {
          case "n":
            event.preventDefault()
            onNewPromptFocus()
            break
          case "s":
            event.preventDefault()
            onSave()
            break
          case "o": // Typically for Open/Import
            event.preventDefault()
            onImport()
            break
        }
      }

      // Navigation shortcuts (only if not editing text, unless it's specific navigation keys)
      if (!isEditingText || ["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", "Tab"].includes(event.key)) {
        switch (event.key) {
          case "ArrowUp":
            if (canNavigatePrompts && !isEditingText) {
              // Allow arrow up/down in textareas
              event.preventDefault()
              onPrevPrompt()
            }
            break
          case "ArrowDown":
            if (canNavigatePrompts && !isEditingText) {
              event.preventDefault()
              onNextPrompt()
            }
            break
          case "ArrowLeft":
          case "Tab": // Shift+Tab for previous
            if (event.shiftKey && event.key === "Tab") {
              // Shift+Tab
              // Potentially move focus from editor to list
              if (document.activeElement && document.activeElement.closest('[data-panel="editor"]')) {
                event.preventDefault()
                onFocusList()
              }
            } else if (event.key === "ArrowLeft" || event.key === "Tab") {
              // Potentially move focus from list to editor
              if (document.activeElement && document.activeElement.closest('[data-panel="list"]')) {
                event.preventDefault()
                onFocusEditor()
              }
            }
            break
          case "ArrowRight":
            if (document.activeElement && document.activeElement.closest('[data-panel="list"]')) {
              event.preventDefault()
              onFocusEditor()
            }
            break
        }
      }
    },
    [onNewPromptFocus, onSave, onImport, onNextPrompt, onPrevPrompt, onFocusList, onFocusEditor, canNavigatePrompts],
  )

  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown)
    return () => {
      document.removeEventListener("keydown", handleKeyDown)
    }
  }, [handleKeyDown])
}
