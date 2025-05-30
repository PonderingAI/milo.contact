# Tools Development Guide

This guide explains how to add new tools to the `/tools` section of the portfolio.

## Overview

The tools section is designed to be a collection of standalone utilities and applications that showcase creative workflows and technical capabilities. Each tool should be self-contained but follow consistent styling and navigation patterns.

## Directory Structure

\`\`\`
app/tools/
├── page.tsx                 # Tools selection page
├── layout.tsx              # Tools layout with metadata
├── prompt-studio/          # Example tool
│   └── page.tsx           # Tool implementation
├── your-new-tool/         # Your tool directory
│   ├── page.tsx          # Main tool component
│   ├── layout.tsx        # Optional tool-specific layout
│   └── components/       # Tool-specific components
└── shared/               # Shared tool components (future)
    ├── tool-wrapper.tsx
    └── back-button.tsx
\`\`\`

## Adding a New Tool

### 1. Create Tool Directory

Create a new directory under `/app/tools/` with your tool name in kebab-case:

\`\`\`bash
mkdir app/tools/your-tool-name
\`\`\`

### 2. Create Tool Page

Create `app/tools/your-tool-name/page.tsx`:

\`\`\`tsx
"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from 'lucide-react'

export default function YourToolPage() {
  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100">
      <header className="p-4 border-b border-neutral-800">
        <div className="flex items-center gap-4">
          <Button asChild variant="ghost" size="sm">
            <Link href="/tools">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Tools
            </Link>
          </Button>
          <h1 className="text-2xl font-serif font-bold">Your Tool Name</h1>
        </div>
      </header>
      
      <main className="container mx-auto px-4 py-8">
        {/* Your tool content here */}
      </main>
    </div>
  )
}
\`\`\`

### 3. Register Tool

Add your tool to the `tools` array in `/app/tools/page.tsx`:

\`\`\`tsx
{
  id: "your-tool-name",
  title: "Your Tool Name",
  description: "Brief description of what your tool does and its key features",
  href: "/tools/your-tool-name",
  icon: YourIcon, // Import from lucide-react
  status: "stable" | "beta" | "experimental",
  tags: ["Category", "Type", "Feature"],
}
\`\`\`

### 4. Optional: Add Tool Layout

Create `app/tools/your-tool-name/layout.tsx` for tool-specific metadata:

\`\`\`tsx
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Your Tool Name - Tools",
  description: "Description of your tool",
}

export default function YourToolLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
\`\`\`

## Styling Guidelines

### Color Palette

Follow the cinematic dark theme:

- **Backgrounds**: `bg-neutral-950` (main), `bg-neutral-900` (cards/panels)
- **Text**: `text-neutral-100` (primary), `text-neutral-400` (secondary)
- **Accents**: `text-teal-400`, `border-teal-400` for highlights
- **Borders**: `border-neutral-800` (subtle), `border-neutral-700` (hover)

### Typography

- **Headlines**: `font-serif` (Playfair Display)
- **Body/UI**: `font-sans` (Inter)
- **Code**: `font-mono`

### Components

Use existing shadcn/ui components when possible:
- `Button`, `Card`, `Input`, `Textarea`
- Follow the variant patterns established in other tools

### Navigation

Always include a "Back to Tools" button in your tool header:

\`\`\`tsx
<Button asChild variant="ghost" size="sm">
  <Link href="/tools">
    <ArrowLeft className="w-4 h-4 mr-2" />
    Back to Tools
  </Link>
</Button>
\`\`\`

## Tool Status Levels

- **stable**: Production-ready, fully tested
- **beta**: Feature-complete but may have minor issues
- **experimental**: Early development, may have significant limitations

## Best Practices

### Performance
- Use `"use client"` only when necessary
- Implement proper loading states
- Consider virtualization for large datasets

### Accessibility
- Include proper ARIA labels
- Support keyboard navigation
- Maintain good color contrast

### User Experience
- Provide clear instructions or onboarding
- Include keyboard shortcuts where appropriate
- Save user state when possible (localStorage, etc.)

### Code Organization
- Keep tool-specific components in the tool directory
- Use shared components for common patterns
- Follow the existing code style and patterns

## Examples

### Simple Utility Tool

\`\`\`tsx
"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function ColorPalettePage() {
  const [color, setColor] = useState("#000000")
  
  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100">
      {/* Header with back button */}
      <main className="container mx-auto px-4 py-8">
        <Card className="bg-neutral-900 border-neutral-800">
          <CardHeader>
            <CardTitle>Color Palette Generator</CardTitle>
          </CardHeader>
          <CardContent>
            <Input 
              type="color" 
              value={color} 
              onChange={(e) => setColor(e.target.value)}
            />
            {/* Tool functionality */}
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
\`\`\`

### Complex Application Tool

For more complex tools like the Prompt Studio, organize components in subdirectories and use proper state management patterns.

## Contributing

When contributing a new tool:

1. Follow the directory structure and naming conventions
2. Include comprehensive documentation in your tool
3. Test across different screen sizes and devices
4. Ensure keyboard accessibility
5. Update this documentation if you add new patterns

## Future Enhancements

Planned improvements to the tools system:

- Shared component library for common tool patterns
- Tool-specific routing and deep linking
- User preferences and settings persistence
- Tool analytics and usage tracking
- Export/import functionality for tool configurations
