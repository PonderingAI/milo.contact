"use client"

import React from "react"

import type { Prompt } from "@/lib/types"
import { cn } from "@/lib/utils"
import { Star } from "lucide-react"

interface PromptListItemProps {
  prompt: Prompt
  isSelected: boolean
  onSelect: () => void
  itemRef?: (element: HTMLLIElement | null) => void
}

export const PromptListItem = React.memo(function PromptListItem({
  prompt,
  isSelected,
  onSelect,
  itemRef,
}: PromptListItemProps) {
  return (
    <li
      ref={itemRef}
      onClick={onSelect}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") onSelect()
      }}
      tabIndex={0}
      className={cn(
        "p-3 cursor-pointer border-b border-neutral-800 hover:bg-neutral-800/50 focus:bg-neutral-800/60 focus:outline-none transition-all duration-150 ease-in-out",
        "focus:ring-2 focus:ring-inset focus:ring-brand-accent",
        isSelected && "bg-neutral-800/70 border-l-2 border-brand-accent",
      )}
      aria-selected={isSelected}
    >
      <p className={cn("text-sm text-brand-text truncate", isSelected && "text-brand-accentText")}>{prompt.text}</p>
      <div className="flex items-center text-xs text-neutral-400 mt-1">
        <Star
          className={cn("w-3 h-3 mr-1", prompt.rating > 0 ? "text-yellow-500 fill-yellow-500" : "text-neutral-600")}
        />
        <span>{prompt.rating.toFixed(1)}/10</span>
      </div>
    </li>
  )
})
