# Site-wide Refresh System

This document describes the site-wide refresh system implemented in the portfolio website. This system allows for real-time updates across the site when content or settings are changed.

## Overview

The refresh system uses a combination of:
- LocalStorage to persist refresh events
- Custom events for same-page communication
- React hooks for component-level integration

This approach minimizes server load and Edge Middleware invocations while providing a way for clients to be notified of content changes.

## Key Components

### 1. `lib/refresh-utils.ts`

This module provides the core functionality:

- `triggerSiteRefresh(type, options)`: Triggers a refresh event
- `useRefreshListener(types, callback)`: React hook to listen for refresh events
- `getLastRefresh()`: Gets information about the last refresh

### 2. Client-side Components

Components that display dynamic content should:
- Use the `useRefreshListener` hook to detect when content has changed
- Re-fetch their data when a relevant refresh event occurs

### 3. Admin Components

Components that modify content should:
- Call `triggerSiteRefresh()` after successful updates
- Specify the type of content that was updated

## Usage Examples

### Triggering a Refresh

\`\`\`typescript
import { triggerSiteRefresh } from '@/lib/refresh-utils';

// After updating settings
async function saveSettings() {
  await updateSettingsInDatabase();
  
  // Notify all clients that settings have changed
  triggerSiteRefresh('settings');
  
  // Or to refresh the current page immediately as well:
  // triggerSiteRefresh('settings', { immediate: true });
}
\`\`\`

### Listening for Refresh Events

\`\`\`typescript
import { useRefreshListener } from '@/lib/refresh-utils';
import { useState, useEffect } from 'react';

function DynamicContent() {
  const [data, setData] = useState(null);
  
  // Function to fetch the latest data
  const fetchData = async () => {
    const response = await fetch('/api/some-data');
    const newData = await response.json();
    setData(newData);
  };
  
  // Initial data fetch
  useEffect(() => {
    fetchData();
  }, []);
  
  // Listen for relevant refresh events
  useRefreshListener(['settings', 'content'], fetchData);
  
  // Render the component...
}
\`\`\`

## Refresh Types

The system uses string identifiers for different types of refreshes. Common types include:

- `'settings'`: Site settings have changed
- `'projects'`: Project content has changed
- `'media'`: Media files have changed
- `'general'`: General refresh (default)

Components can listen for specific types or all types.

## Best Practices

1. **Be Specific**: Use specific refresh types to avoid unnecessary re-fetching
2. **Minimize Refreshes**: Only trigger refreshes when necessary
3. **Handle Loading States**: Show loading indicators during refresh operations
4. **Cache-Busting**: Add timestamp parameters to image URLs to prevent caching issues
5. **Error Handling**: Implement proper error handling in refresh callbacks

## Implementation Notes

- The system works across tabs/windows of the same browser
- It does not require server-side support or WebSockets
- It has minimal impact on performance
- It respects user privacy (only uses localStorage, not cookies)
