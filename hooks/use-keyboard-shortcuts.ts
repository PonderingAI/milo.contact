"use client"

import { useEffect, useCallback } from "react"

type KeyboardShortcutHandler = (e: KeyboardEvent) => void

interface KeyboardShortcutsConfig {
  [key: string]: KeyboardShortcutHandler
}

export function useKeyboardShortcuts(shortcuts: KeyboardShortcutsConfig, dependencies: any[] = [], isDisabled = false) {
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (isDisabled) return

      // Skip if user is typing in an input, textarea, or contentEditable element
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement ||
        (e.target instanceof HTMLElement && e.target.isContentEditable)
      ) {
        // Allow specific shortcuts even in input fields
        const isGlobalShortcut =
          (e.ctrlKey && e.key === "n") || // Ctrl+N
          (e.ctrlKey && e.key === "s") || // Ctrl+S
          (e.ctrlKey && e.key === "o") // Ctrl+O

        if (!isGlobalShortcut) return
      }

      // Generate shortcut key
      let shortcutKey = ""
      if (e.ctrlKey) shortcutKey += "ctrl+"
      if (e.altKey) shortcutKey += "alt+"
      if (e.shiftKey) shortcutKey += "shift+"
      if (e.metaKey) shortcutKey += "meta+"
      shortcutKey += e.key.toLowerCase()

      // Check if we have a handler for this shortcut
      const handler = shortcuts[shortcutKey]
      if (handler) {
        e.preventDefault()
        handler(e)
      }
    },
    [shortcuts, isDisabled, ...dependencies],
  )

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown)
    return () => {
      window.removeEventListener("keydown", handleKeyDown)
    }
  }, [handleKeyDown])
}
