"use client"
import { Button } from "@/components/ui/button"

interface DependencyListFiltersProps {
  filter: string
  onFilterChange: (filter: string) => void
}

export default function DependencyListFilters({ filter, onFilterChange }: DependencyListFiltersProps) {
  const filters = [
    { id: "all", label: "All" },
    { id: "updates", label: "Updates" },
    { id: "vulnerabilities", label: "Vulnerabilities" },
    { id: "production", label: "Production" },
    { id: "development", label: "Development" },
  ]

  return (
    <div className="flex space-x-2 overflow-x-auto pb-2">
      {filters.map(({ id, label }) => (
        <Button
          key={id}
          variant={filter === id ? "default" : "outline"}
          size="sm"
          onClick={() => onFilterChange(id)}
          className="whitespace-nowrap"
        >
          {label}
        </Button>
      ))}
    </div>
  )
}
