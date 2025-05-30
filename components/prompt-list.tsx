"use client"

import { useRef, useEffect } from "react"
import type { Prompt } from "@/lib/types"
import { PromptListItem } from "./prompt-list-item"
import { ScrollArea } from "@/components/ui/scroll-area"

interface PromptListProps {
  prompts: Prompt[]
  selectedPromptId: string | null
  onSelectPrompt: (id: string) => void
}

export function PromptList({ prompts, selectedPromptId, onSelectPrompt }: PromptListProps) {
  const listRef = useRef<HTMLDivElement>(null)
  const selectedItemRef = useRef<HTMLDivElement>(null)

  // Scroll to selected item when it changes
  useEffect(() => {
    if (selectedPromptId && selectedItemRef.current) {
      selectedItemRef.current.scrollIntoView({
        behavior: "smooth",
        block: "nearest",
      })
    }
  }, [selectedPromptId])

  return (
    <ScrollArea className="h-full">
      <div ref={listRef} className="divide-y divide-neutral-800">
        {prompts.length === 0 ? (
          <div className="p-8 text-center text-neutral-400">
            <p>No prompts yet. Add your first prompt above.</p>
          </div>
        ) : (
          prompts.map((prompt) => (
            <div key={prompt.promptId} ref={prompt.promptId === selectedPromptId ? selectedItemRef : null}>
              <PromptListItem
                prompt={prompt}
                isSelected={prompt.promptId === selectedPromptId}
                onClick={() => onSelectPrompt(prompt.promptId)}
              />
            </div>
          ))
        )}
      </div>
    </ScrollArea>
  )
}
