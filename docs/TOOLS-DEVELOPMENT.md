# Tools Development Guide

This document provides guidelines for developing and adding new tools to the `/tools` section of the portfolio.

## Overview

The tools section is designed to showcase interactive utilities and applications that demonstrate your skills and provide value to users. Each tool should be self-contained, well-documented, and follow the established design patterns.

## Adding a New Tool

### 1. Create the Tool Directory

Create a new directory for your tool under `/app/tools/`:

\`\`\`
/app/tools/your-tool-name/
\`\`\`

### 2. Create the Main Page Component

Add a `page.tsx` file in your tool directory:

\`\`\`tsx
'use client';

import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export default function YourToolPage() {
  return (
    <div className="min-h-screen bg-black text-neutral-100 flex flex-col">
      <header className="border-b border-neutral-800 p-4">
        <div className="container mx-auto flex items-center space-x-4">
          <Link href="/tools" className="text-neutral-400 hover:text-neutral-100 transition-colors">
            <ArrowLeft className="h-5 w-5" />
            <span className="sr-only">Back to Tools</span>
          </Link>
          <h1 className="font-serif text-2xl">Your Tool Name</h1>
        </div>
      </header>

      <main className="container mx-auto p-4 flex-1">
        {/* Your tool content here */}
      </main>
    </div>
  );
}
\`\`\`

### 3. Register Your Tool

Add your tool to the `tools` array in `/app/tools/page.tsx`:

\`\`\`tsx
import { UsersIcon as YourIcon } from 'lucide-react';

const tools = [
  // Existing tools...
  {
    id: 'your-tool-name',
    name: 'Your Tool Name',
    description: 'A brief description of what your tool does.',
    icon: YourIcon,
    status: 'beta', // 'stable', 'beta', or 'experimental'
    tags: ['Category', 'Another Category']
  }
];
\`\`\`

## Design Guidelines

### Colors

- **Background:** `bg-black` or `bg-neutral-900`
- **Borders:** `border-neutral-800`
- **Text:** `text-neutral-100` (primary), `text-neutral-400` (secondary)
- **Accents:** `text-teal-400`, `bg-teal-900/30` (use sparingly)

### Typography

- **Headings:** `font-serif` (Playfair Display)
- **Body:** `font-sans` (Inter)

### Components

Use the existing UI components from `/components/ui/` when possible:

- Button
- Input
- Textarea
- Dialog
- ScrollArea
- etc.

## Best Practices

### State Management

- Use React hooks for simple state management
- Consider custom hooks for complex logic
- Use local storage for persistence when appropriate

### Performance

- Implement virtualization for large lists
- Use memoization for expensive computations
- Optimize re-renders with `React.memo`, `useCallback`, and `useMemo`

### Accessibility

- Ensure keyboard navigation works properly
- Add proper ARIA attributes
- Maintain sufficient color contrast
- Include screen reader text where needed

### User Experience

- Implement keyboard shortcuts
- Add loading states for async operations
- Include error handling
- Provide clear feedback for user actions

## Testing

- Add unit tests for critical functionality
- Test on different devices and screen sizes
- Verify keyboard navigation works

## Documentation

Each tool should include:

- Clear instructions for use
- Documentation of keyboard shortcuts
- Explanation of data storage (if applicable)
- Any limitations or known issues

## Example Tools

Consider developing tools such as:

- Color palette generators
- Code formatters/converters
- Design utilities
- Creative tools
- Productivity enhancers
- Data visualization tools

## Deployment

Tools are automatically deployed with the main portfolio. Ensure your tool works in the production environment by testing it thoroughly in development first.
