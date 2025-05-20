"use client"
import React from 'react';

import { Button } from "@/components/ui/button"

interface SimpleTagFilterProps {
  title?: string
  tags: string[]
  selectedTag: string
  onChange: (tag: string) => void
  className?: string
}

export default function SimpleTagFilter({ title, tags, selectedTag, onChange, className }: SimpleTagFilterProps) {
  if (!tags || tags.length === 0) {
    return null
  }

  return (
    <div className={className}>
      {title && <h4 className="mb-2 text-sm font-medium text-gray-400">{title}</h4>}
      <div className="flex flex-wrap gap-2">
        {tags.map((tag) => (
          <Button
            key={tag}
            variant={selectedTag === tag ? "default" : "outline"}
            size="sm"
            onClick={() => onChange(tag)}
            className="rounded-full px-3 py-1 text-xs h-auto min-h-[2rem]"
          >
            {tag}
          </Button>
        ))}
      </div>
    </div>
  )
}
