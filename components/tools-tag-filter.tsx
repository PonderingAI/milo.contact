"use client"

import { Button } from "@/components/ui/button"

interface ToolsTagFilterProps {
  title?: string
  tags: string[]
  selectedTag: string
  onChange: (tag: string) => void
  className?: string
}

export default function ToolsTagFilter({ title, tags, selectedTag, onChange, className }: ToolsTagFilterProps) {
  if (!tags || tags.length === 0) {
    return null
  }

  return (
    <div className={className}>
      {title && <h4 className="mb-2 text-sm font-medium text-gray-400">{title}</h4>}
      <div className="flex flex-wrap gap-2">
        <Button
          variant={selectedTag === "All" ? "default" : "outline"}
          size="sm"
          onClick={() => onChange("All")}
          className="rounded-full px-3 py-1 text-xs h-auto min-h-[2rem]"
        >
          All
        </Button>
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
