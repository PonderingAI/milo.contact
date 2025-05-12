# Widget Development Guide

This guide explains how to create custom widgets for the admin dashboard. The dashboard uses a flexible widget system that allows for easy creation and integration of new widgets.

## Table of Contents

1. [Widget System Overview](#widget-system-overview)
2. [Creating a Basic Widget](#creating-a-basic-widget)
3. [Widget Definition Structure](#widget-definition-structure)
4. [Registering Your Widget](#registering-your-widget)
5. [Advanced Widget Features](#advanced-widget-features)
6. [Best Practices](#best-practices)
7. [Troubleshooting](#troubleshooting)

## Widget System Overview

The dashboard widget system consists of several key components:

- **WidgetContainer**: The main container that manages the grid layout and widget positioning
- **DashboardWidget**: Individual widget component with drag/resize functionality
- **WidgetSelector**: Popup for selecting widgets to add to the dashboard
- **Widget Registry**: Central registry of all available widget definitions

Widgets are rendered in a responsive grid layout that automatically adjusts based on screen size. Each widget can be:

- Dragged to reposition
- Resized from the edges and corners
- Removed from the dashboard
- Maximized to fill more space

## Creating a Basic Widget

Creating a new widget involves three main steps:

1. Create the widget component
2. Define the widget properties
3. Register the widget in the widget registry

### Step 1: Create the Widget Component

Create a new file in the `components/admin/dashboard/widgets` directory:

\`\`\`tsx
"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface MyWidgetProps {
  title?: string
  // Add your custom props here
}

export function MyWidget({
  title = "My Widget",
  // Default values for your props
}: MyWidgetProps) {
  // Your widget logic here
  
  return (
    <div className="h-full w-full">
      <Card className="h-full">
        <CardHeader className="p-4">
          <CardTitle className="text-base font-medium">{title}</CardTitle>
        </CardHeader>
        <CardContent className="p-4">
          {/* Your widget content here */}
          <div>Widget content goes here</div>
        </CardContent>
      </Card>
    </div>
  )
}
\`\`\`

### Step 2: Define the Widget Properties

In your widget registry file, define your widget's properties:

\`\`\`tsx
import { MyWidget } from "./widgets/my-widget"

// Add to the widgetRegistry array
{
  type: "my-widget", // Unique identifier
  title: "My Widget", // Display name
  description: "Description of what my widget does",
  category: "my-category", // For grouping in the selector
  component: MyWidget, // Your widget component
  defaultSize: { w: 3, h: 2, minW: 2, minH: 1, maxW: 6, maxH: 4 },
  defaultProps: {
    title: "My Widget",
    // Other default props
  },
}
\`\`\`

### Step 3: Register Your Widget

Import your widget in the `widget-registry.tsx` file and add it to the `widgetRegistry` array.

## Widget Definition Structure

Each widget definition must include the following properties:

| Property | Type | Description |
|----------|------|-------------|
| `type` | string | Unique identifier for the widget |
| `title` | string | Display name shown in the selector |
| `description` | string | Brief description of the widget |
| `category` | string | Category for grouping in the selector |
| `component` | React.ComponentType | The actual widget component |
| `defaultSize` | object | Default size and constraints |
| `defaultProps` | object | Default props passed to the component |

The `defaultSize` object has the following properties:

| Property | Type | Description |
|----------|------|-------------|
| `w` | number | Width in grid units |
| `h` | number | Height in grid units |
| `minW` | number | Minimum width (optional) |
| `minH` | number | Minimum height (optional) |
| `maxW` | number | Maximum width (optional) |
| `maxH` | number | Maximum height (optional) |

## Registering Your Widget

To make your widget available in the dashboard, add it to the `widgetRegistry` array in `widget-registry.tsx`:

\`\`\`tsx
import { MyWidget } from "./widgets/my-widget"

export const widgetRegistry: WidgetDefinition[] = [
  // Existing widgets...
  
  // Your new widget
  {
    type: "my-widget",
    title: "My Widget",
    description: "Description of what my widget does",
    category: "my-category",
    component: MyWidget,
    defaultSize: { w: 3, h: 2, minW: 2, minH: 1, maxW: 6, maxH: 4 },
    defaultProps: {
      title: "My Widget",
      // Other default props
    },
  },
]
\`\`\`

## Advanced Widget Features

### Data Fetching

For widgets that need to fetch data, use React's `useEffect` hook:

\`\`\`tsx
"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"

export function DataWidget({ endpoint = "/api/data" }) {
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        const response = await fetch(endpoint)
        if (!response.ok) throw new Error("Failed to fetch data")
        const result = await response.json()
        setData(result)
      } catch (err) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [endpoint])

  if (loading) return <div>Loading...</div>
  if (error) return <div>Error: {error}</div>

  return (
    <Card className="h-full">
      <CardContent className="p-4">
        {/* Render your data here */}
      </CardContent>
    </Card>
  )
}
\`\`\`

### Responsive Design

Widgets should adapt to different sizes. Use CSS Grid or Flexbox for responsive layouts:

\`\`\`tsx
<div className="grid grid-cols-1 md:grid-cols-2 gap-4 h-full">
  <div className="flex flex-col">
    {/* Content for first column */}
  </div>
  <div className="flex flex-col">
    {/* Content for second column */}
  </div>
</div>
\`\`\`

### Widget Configuration

For widgets that need user configuration, implement a settings modal:

\`\`\`tsx
"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Settings } from 'lucide-react'

export function ConfigurableWidget({ onSettingsChange, settings = {} }) {
  const [open, setOpen] = useState(false)
  const [localSettings, setLocalSettings] = useState(settings)

  const saveSettings = () => {
    onSettingsChange(localSettings)
    setOpen(false)
  }

  return (
    <div className="h-full">
      <div className="flex justify-end mb-2">
        <Button variant="ghost" size="sm" onClick={() => setOpen(true)}>
          <Settings className="h-4 w-4" />
        </Button>
      </div>
      
      {/* Widget content using settings */}
      
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Widget Settings</DialogTitle>
          </DialogHeader>
          
          {/* Settings form */}
          
          <Button onClick={saveSettings}>Save Settings</Button>
        </DialogContent>
      </Dialog>
    </div>
  )
}
\`\`\`

## Best Practices

1. **Keep Widgets Focused**: Each widget should do one thing well
2. **Handle Loading States**: Always show loading indicators when fetching data
3. **Error Handling**: Gracefully handle errors and provide feedback
4. **Responsive Design**: Ensure widgets look good at all sizes
5. **Performance**: Optimize rendering and data fetching
6. **Accessibility**: Ensure widgets are accessible with proper ARIA attributes
7. **Consistent Styling**: Follow the Material 3 design language
8. **Default Props**: Always provide sensible defaults for all props

## Troubleshooting

### Widget Not Appearing in Selector

- Check that your widget is properly registered in `widget-registry.tsx`
- Verify that the `type` is unique across all widgets

### Widget Not Rendering Correctly

- Check the console for errors
- Verify that your component is properly exported
- Ensure all required props are being passed

### Layout Issues

- Check that your widget respects the container dimensions
- Use relative units (%, rem) instead of fixed units (px)
- Test at different sizes to ensure responsiveness

### Performance Issues

- Minimize state updates
- Use memoization for expensive calculations
- Implement virtualization for large data sets
\`\`\`

Let's complete the widget system by updating the remaining files:
