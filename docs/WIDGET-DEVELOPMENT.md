# Widget Development Guide

This guide explains how to create custom widgets for the admin dashboard.

## Overview

The dashboard uses a flexible widget system that allows for:
- Dragging and repositioning widgets
- Resizing widgets
- Automatic layout reordering
- Persistent layouts saved to localStorage

## Creating a New Widget

### 1. Create the Widget Component

First, create a new component in the `components/admin/dashboard/widgets` directory:

\`\`\`tsx
// components/admin/dashboard/widgets/my-custom-widget.tsx
"use client"

import { useState, useEffect } from "react"

interface MyCustomWidgetProps {
  title?: string
  // Add any other props your widget needs
}

export function MyCustomWidget({
  title = "My Widget",
  // Default values for other props
}: MyCustomWidgetProps) {
  // Your widget state and logic here

  return (
    <div className="h-full w-full">
      <h3 className="text-sm font-medium mb-4">{title}</h3>
      {/* Your widget content here */}
      <div>Widget content goes here</div>
    </div>
  )
}
\`\`\`

### 2. Register the Widget

Add your widget to the widget registry in `components/admin/dashboard/widget-registry.tsx`:

\`\`\`tsx
import { MyCustomWidget } from "./widgets/my-custom-widget"
// Other imports...

export const widgetRegistry: WidgetDefinition[] = [
  // Existing widgets...
  
  {
    type: "my-custom-widget", // Unique identifier
    title: "My Custom Widget", // Display name
    description: "Description of what this widget does",
    category: "my-category", // Group for the widget selector
    component: MyCustomWidget, // Your component
    defaultSize: { w: 4, h: 3, minW: 2, minH: 2 }, // Default grid size
    defaultProps: {
      // Default props to pass to your component
      title: "My Custom Widget",
      // Other props...
    },
  },
]
\`\`\`

### 3. Widget Best Practices

1. **Responsive Design**
   - Make your widget responsive to its container size
   - Use flex or grid layouts for content
   - Test at different sizes

2. **Performance**
   - Avoid expensive operations in render
   - Use memoization for complex calculations
   - Lazy load data when possible

3. **Error Handling**
   - Handle loading states
   - Provide fallbacks for missing data
   - Catch and display errors gracefully

4. **Accessibility**
   - Use semantic HTML
   - Ensure proper contrast
   - Add appropriate ARIA attributes

## Widget Props

Your widget component will receive the props specified in the `defaultProps` of its registry entry, plus any props added when the widget is instantiated.

## Widget Sizing

The `defaultSize` property in the widget registry defines:

- `w`: Width in grid columns
- `h`: Height in grid rows
- `minW`: Minimum width (optional)
- `minH`: Minimum height (optional)
- `maxW`: Maximum width (optional)
- `maxH`: Maximum height (optional)

## Data Fetching

For widgets that need to fetch data:

\`\`\`tsx
"use client"

import { useState, useEffect } from "react"

export function DataWidget({ endpoint = "/api/data" }) {
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        const response = await fetch(endpoint)
        if (!response.ok) throw new Error("Failed to fetch data")
        const result = await response.json()
        setData(result)
      } catch (err) {
        setError(err instanceof Error ? err : new Error(String(err)))
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [endpoint])

  if (loading) return <div>Loading...</div>
  if (error) return <div>Error: {error.message}</div>

  return (
    <div className="h-full w-full">
      {/* Render your data here */}
    </div>
  )
}
\`\`\`

## Advanced Widget Features

### Real-time Updates

For widgets that need real-time updates:

\`\`\`tsx
useEffect(() => {
  const interval = setInterval(async () => {
    // Fetch updated data
  }, 30000) // Update every 30 seconds

  return () => clearInterval(interval)
}, [])
\`\`\`

### Interactive Widgets

For widgets with user interaction:

\`\`\`tsx
function InteractiveWidget() {
  const [selected, setSelected] = useState(null)

  const handleSelect = (item) => {
    setSelected(item)
    // Perform actions based on selection
  }

  return (
    <div className="h-full w-full">
      {/* Interactive elements */}
    </div>
  )
}
\`\`\`

## Troubleshooting

### Widget Not Appearing

- Check that your widget is properly registered in the widget registry
- Verify that the component is exported correctly
- Check the browser console for errors

### Layout Issues

- Ensure your widget respects its container size
- Use height: 100% and width: 100% for the root element
- Test resizing behavior

### Data Issues

- Verify API endpoints
- Add error handling for failed requests
- Provide fallback UI for loading and error states
