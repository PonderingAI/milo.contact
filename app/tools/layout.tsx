import type React from "react"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Tools - Milo Presedo",
  description: "Creative tools and utilities for enhanced workflows",
  keywords: ["tools", "utilities", "creative", "workflow", "productivity"],
}

export default function ToolsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
