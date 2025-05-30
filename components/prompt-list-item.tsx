"use client"

import { memo } from "react"
import type { Prompt } from "@/lib/types"

interface PromptListItemProps {
  prompt: Prompt
  isSelected: boolean
  onClick: () => void
}

export const PromptListItem = memo(function PromptListItem({ prompt, isSelected, onClick }: PromptListItemProps) {
  return (
    <div
      onClick={onClick}
      className={`p-4 border-b border-neutral-800 cursor-pointer transition-all duration-200 ${
        isSelected ? "bg-neutral-800 ring-1 ring-teal-800" : "bg-neutral-900 hover:bg-neutral-800"
      }`}
      data-prompt-id={prompt.promptId}
      role="button"
      tabIndex={0}
      aria-selected={isSelected}
    >
      <div className="flex justify-between items-start mb-2">
        <p className="text-neutral-100 font-medium line-clamp-2">{prompt.text}</p>
        <div className="ml-2 px-2 py-1 bg-neutral-800 rounded text-sm font-mono text-teal-400">
          {prompt.rating.toFixed(1)}
        </div>
      </div>

      {prompt.notes && <p className="text-neutral-400 text-sm line-clamp-1">{prompt.notes}</p>}

      {prompt.tags && prompt.tags.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-2">
          {prompt.tags.map((tag) => (
            <span key={tag} className="px-1.5 py-0.5 bg-neutral-800 text-neutral-300 text-xs rounded">
              {tag}
            </span>
          ))}
        </div>
      )}
    </div>
  )
})
