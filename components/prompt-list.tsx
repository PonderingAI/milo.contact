"use client"

import type React from "react"

import type { Prompt } from "@/lib/types"
import { ScrollArea } from "@/components/ui/scroll-area"
import { PromptListItem } from "./prompt-list-item"

interface PromptListProps {
  prompts: Prompt[]
  selectedPromptId: string | null
  onSelectPrompt: (id: string) => void
  listRef?: React.RefObject<HTMLUListElement>
  getItemRef?: (index: number) => (element: HTMLLIElement | null) => void
}

export function PromptList({ prompts, selectedPromptId, onSelectPrompt, listRef, getItemRef }: PromptListProps) {
  if (prompts.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center text-neutral-500 p-4">
        No prompts yet. Add one to get started!
      </div>
    )
  }

  return (
    <ScrollArea className="flex-1 h-full">
      <ul ref={listRef} className="p-1">
        {prompts.map((prompt, index) => (
          <PromptListItem
            key={prompt.promptId}
            prompt={prompt}
            isSelected={prompt.promptId === selectedPromptId}
            onSelect={() => onSelectPrompt(prompt.promptId)}
            itemRef={getItemRef ? getItemRef(index) : undefined}
          />
        ))}
      </ul>
    </ScrollArea>
  )
}
