import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Palette, Plus } from "lucide-react"

const tools = [
  {
    id: "prompt-studio",
    title: "Prompt Studio",
    description:
      "A cinematic dark-mode prompt manager for AI image generation. Rate, organize, and export your prompts with keyboard-first navigation.",
    href: "/tools/prompt-studio",
    icon: Palette,
    status: "stable" as const,
    tags: ["AI", "Prompts", "Organization"],
  },
  // Add more tools here as they're created
]

export default function ToolsPage() {
  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100">
      <div className="container mx-auto px-4 py-8">
        <header className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <Button asChild variant="ghost" size="sm" className="text-neutral-400 hover:text-neutral-100">
              <Link href="/">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Portfolio
              </Link>
            </Button>
          </div>
          <h1 className="text-4xl font-serif font-bold text-neutral-100 mb-2">Creative Tools</h1>
          <p className="text-lg text-neutral-400">A collection of utilities and applications for creative workflows</p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          {tools.map((tool) => {
            const IconComponent = tool.icon
            return (
              <Card
                key={tool.id}
                className="bg-neutral-900 border-neutral-800 hover:border-neutral-700 transition-colors"
              >
                <CardHeader>
                  <div className="flex items-center gap-3 mb-2">
                    <IconComponent className="w-6 h-6 text-teal-400" />
                    <CardTitle className="text-neutral-100">{tool.title}</CardTitle>
                    <span
                      className={`px-2 py-1 text-xs rounded-full ${
                        tool.status === "stable"
                          ? "bg-green-900 text-green-300"
                          : tool.status === "beta"
                            ? "bg-yellow-900 text-yellow-300"
                            : "bg-blue-900 text-blue-300"
                      }`}
                    >
                      {tool.status}
                    </span>
                  </div>
                  <CardDescription className="text-neutral-400">{tool.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2 mb-4">
                    {tool.tags.map((tag) => (
                      <span key={tag} className="px-2 py-1 text-xs bg-neutral-800 text-neutral-300 rounded">
                        {tag}
                      </span>
                    ))}
                  </div>
                  <Button asChild className="w-full bg-teal-600 hover:bg-teal-700 text-white">
                    <Link href={tool.href}>Launch Tool</Link>
                  </Button>
                </CardContent>
              </Card>
            )
          })}

          {/* Add new tool placeholder */}
          <Card className="bg-neutral-900 border-neutral-800 border-dashed hover:border-neutral-700 transition-colors">
            <CardContent className="flex flex-col items-center justify-center h-full min-h-[200px] text-center">
              <Plus className="w-12 h-12 text-neutral-600 mb-4" />
              <h3 className="text-lg font-semibold text-neutral-400 mb-2">Add New Tool</h3>
              <p className="text-sm text-neutral-500 mb-4">See the documentation below to contribute a new tool</p>
              <Button
                variant="outline"
                size="sm"
                className="border-neutral-700 text-neutral-400 hover:text-neutral-100"
              >
                <Link href="#documentation">View Docs</Link>
              </Button>
            </CardContent>
          </Card>
        </div>

        <section id="documentation" className="border-t border-neutral-800 pt-8">
          <h2 className="text-2xl font-serif font-bold text-neutral-100 mb-4">Adding New Tools</h2>
          <div className="prose prose-invert max-w-none">
            <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-6 mb-6">
              <h3 className="text-lg font-semibold text-neutral-100 mb-3">Quick Start</h3>
              <ol className="list-decimal list-inside space-y-2 text-neutral-300">
                <li>
                  Create a new directory under{" "}
                  <code className="bg-neutral-800 px-2 py-1 rounded text-teal-400">/app/tools/your-tool-name/</code>
                </li>
                <li>
                  Add a <code className="bg-neutral-800 px-2 py-1 rounded text-teal-400">page.tsx</code> file with your
                  tool component
                </li>
                <li>
                  Update the tools array in{" "}
                  <code className="bg-neutral-800 px-2 py-1 rounded text-teal-400">/app/tools/page.tsx</code>
                </li>
                <li>Follow the styling guidelines below for consistency</li>
              </ol>
            </div>

            <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-6 mb-6">
              <h3 className="text-lg font-semibold text-neutral-100 mb-3">Directory Structure</h3>
              <pre className="bg-neutral-800 p-4 rounded text-sm text-neutral-300 overflow-x-auto">
                {`app/tools/
├── page.tsx                 # Tools selection page
├── layout.tsx              # Tools layout
├── your-tool-name/
│   ├── page.tsx           # Main tool component
│   ├── layout.tsx         # Optional tool-specific layout
│   └── components/        # Tool-specific components
│       ├── tool-header.tsx
│       └── tool-sidebar.tsx
└── shared/                # Shared tool components
    ├── tool-wrapper.tsx
    └── back-button.tsx`}
              </pre>
            </div>

            <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-6 mb-6">
              <h3 className="text-lg font-semibold text-neutral-100 mb-3">Tool Registration</h3>
              <p className="text-neutral-300 mb-3">
                Add your tool to the tools array in{" "}
                <code className="bg-neutral-800 px-2 py-1 rounded text-teal-400">/app/tools/page.tsx</code>:
              </p>
              <pre className="bg-neutral-800 p-4 rounded text-sm text-neutral-300 overflow-x-auto">
                {`{
  id: "your-tool-name",
  title: "Your Tool Name",
  description: "Brief description of what your tool does",
  href: "/tools/your-tool-name",
  icon: YourIcon, // Import from lucide-react
  status: "stable" | "beta" | "experimental",
  tags: ["Category", "Type", "Feature"],
}`}
              </pre>
            </div>

            <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-6 mb-6">
              <h3 className="text-lg font-semibold text-neutral-100 mb-3">Styling Guidelines</h3>
              <div className="space-y-3 text-neutral-300">
                <div>
                  <h4 className="font-semibold text-neutral-100">Color Palette</h4>
                  <ul className="list-disc list-inside ml-4 space-y-1">
                    <li>
                      <code className="bg-neutral-800 px-2 py-1 rounded">bg-neutral-950</code> - Main background
                    </li>
                    <li>
                      <code className="bg-neutral-800 px-2 py-1 rounded">bg-neutral-900</code> - Card/panel backgrounds
                    </li>
                    <li>
                      <code className="bg-neutral-800 px-2 py-1 rounded">text-neutral-100</code> - Primary text
                    </li>
                    <li>
                      <code className="bg-neutral-800 px-2 py-1 rounded">text-neutral-400</code> - Secondary text
                    </li>
                    <li>
                      <code className="bg-neutral-800 px-2 py-1 rounded">text-teal-400</code> - Accent color
                    </li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold text-neutral-100">Typography</h4>
                  <ul className="list-disc list-inside ml-4 space-y-1">
                    <li>
                      <code className="bg-neutral-800 px-2 py-1 rounded">font-serif</code> - For headlines and titles
                    </li>
                    <li>
                      <code className="bg-neutral-800 px-2 py-1 rounded">font-sans</code> - For body text and UI
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-neutral-100 mb-3">Example Tool Template</h3>
              <pre className="bg-neutral-800 p-4 rounded text-sm text-neutral-300 overflow-x-auto">
                {`"use client"

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
}`}
              </pre>
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}
