// Grid constants
export const GRID_CELL_SIZE = 20 // Size of each grid cell in pixels
export const MIN_WIDGET_WIDTH = 4 // Minimum widget width in grid cells
export const MIN_WIDGET_HEIGHT = 3 // Minimum widget height in grid cells

// Calculate grid position from pixel values
export function pixelsToGridUnits(pixels: number): number {
  return Math.round(pixels / GRID_CELL_SIZE)
}

// Calculate pixel values from grid units
export function gridUnitsToPixels(units: number): number {
  return units * GRID_CELL_SIZE
}

// Snap a value to the nearest grid cell
export function snapToGrid(value: number): number {
  return Math.round(value / GRID_CELL_SIZE) * GRID_CELL_SIZE
}

// Calculate responsive grid columns based on screen width
export function calculateGridColumns(width: number): number {
  if (width < 640) return 12 // Mobile
  if (width < 1024) return 24 // Tablet
  return 36 // Desktop
}

// Widget position and size interface
export interface WidgetLayout {
  id: string
  x: number
  y: number
  width: number
  height: number
}

// Find the first available position for a new widget
export function findAvailablePosition(
  layouts: WidgetLayout[],
  width: number,
  height: number,
  columns: number,
): { x: number; y: number } {
  // Create a 2D grid representation
  const grid: boolean[][] = []

  // Find the maximum Y coordinate to know how tall our grid needs to be
  const maxY = layouts.reduce((max, layout) => Math.max(max, layout.y + layout.height), 0)

  // Initialize grid
  for (let y = 0; y <= maxY + height; y++) {
    grid[y] = []
    for (let x = 0; x < columns; x++) {
      grid[y][x] = false
    }
  }

  // Mark occupied cells
  layouts.forEach((layout) => {
    for (let y = layout.y; y < layout.y + layout.height; y++) {
      for (let x = layout.x; x < layout.x + layout.width; x++) {
        if (grid[y] && x < columns) {
          grid[y][x] = true
        }
      }
    }
  })

  // Find first available position
  for (let y = 0; y < grid.length; y++) {
    for (let x = 0; x <= columns - width; x++) {
      let canFit = true

      // Check if the widget can fit at this position
      for (let dy = 0; dy < height; dy++) {
        for (let dx = 0; dx < width; dx++) {
          if (grid[y + dy] && grid[y + dy][x + dx]) {
            canFit = false
            break
          }
        }
        if (!canFit) break
      }

      if (canFit) {
        return { x, y }
      }
    }
  }

  // If no position found, place it at the bottom
  return { x: 0, y: maxY }
}

// Compact the layout to fill empty spaces
export function compactLayout(layouts: WidgetLayout[], columns: number): WidgetLayout[] {
  // Sort layouts by y position (top to bottom)
  const sortedLayouts = [...layouts].sort((a, b) => a.y - b.y)
  const compactedLayouts: WidgetLayout[] = []

  // Process each widget
  sortedLayouts.forEach((layout) => {
    // Try to move the widget up as much as possible
    let newY = layout.y
    let canMoveUp = true

    while (canMoveUp && newY > 0) {
      canMoveUp = true
      newY--

      // Check if this position conflicts with any existing widget
      for (const existingLayout of compactedLayouts) {
        if (
          layout.x < existingLayout.x + existingLayout.width &&
          layout.x + layout.width > existingLayout.x &&
          newY < existingLayout.y + existingLayout.height &&
          newY + layout.height > existingLayout.y
        ) {
          canMoveUp = false
          newY++
          break
        }
      }
    }

    compactedLayouts.push({
      ...layout,
      y: newY,
    })
  })

  return compactedLayouts
}
