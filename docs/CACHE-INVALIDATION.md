# Cache Invalidation System

This document explains the cache invalidation system used in the Milo Presedo portfolio site. The system is designed to be efficient, minimizing bandwidth usage while ensuring content changes are reflected promptly.

## Overview

The cache invalidation system allows the site to update content without requiring a full page reload or deployment. It's particularly useful for:

- Updating site settings (like the hero background)
- Refreshing project data
- Ensuring media changes are visible immediately

## Key Components

1. **Cache Utilities (`lib/cache-utils.ts`)**
   - Provides functions for invalidating specific paths or the entire site
   - Includes throttling to prevent excessive invalidations
   - Offers common invalidation patterns for frequently used scenarios

2. **Revalidation API (`app/api/revalidate/route.ts`)**
   - Handles cache invalidation requests
   - Includes security checks to ensure only authorized users can trigger invalidations
   - Implements rate limiting to prevent abuse

## Usage

### Basic Invalidation

To invalidate a specific path:

\`\`\`typescript
import { invalidateCache } from '@/lib/cache-utils'

// Invalidate the home page
await invalidateCache('/')

// Invalidate a specific project page
await invalidateCache('/projects/123')
\`\`\`

### Using Common Patterns

For frequently used invalidation patterns:

\`\`\`typescript
import { commonInvalidations } from '@/lib/cache-utils'

// Invalidate the home page and its components
await commonInvalidations.home()

// Invalidate all project-related pages
await commonInvalidations.projects()

// Invalidate site-wide settings
await commonInvalidations.siteSettings()
\`\`\`

### Forcing Invalidation

To bypass throttling when immediate invalidation is necessary:

\`\`\`typescript
// Force invalidation even if recently invalidated
await invalidateCache('/', true)

// Force invalidation for common patterns
await commonInvalidations.siteSettings(true)
\`\`\`

## Optimization Features

The system includes several optimizations to minimize unnecessary fetching:

1. **Throttling**: Prevents the same path from being invalidated too frequently
2. **Deduplication**: Removes duplicate paths when invalidating multiple paths
3. **Rate Limiting**: Prevents abuse by limiting the number of invalidation requests
4. **Targeted Invalidation**: Only invalidates what's necessary, not the entire site

## Security Considerations

The revalidation API includes several security measures:

1. **Authentication**: Only authenticated users can trigger invalidations
2. **Role-Based Access**: Only admin users can trigger invalidations
3. **Rate Limiting**: Prevents abuse by limiting the number of invalidation requests
4. **Input Validation**: Ensures the path parameter is valid

## Troubleshooting

If content changes are not reflected after invalidation:

1. Check the browser console for error messages
2. Verify the correct path is being invalidated
3. Try forcing invalidation with the second parameter set to `true`
4. Clear browser cache manually if necessary

## Best Practices

1. **Be Specific**: Invalidate only the paths that need to be updated
2. **Group Related Changes**: Make all related changes before invalidating
3. **Respect Throttling**: Only force invalidation when absolutely necessary
4. **Monitor Usage**: Watch for excessive invalidations that might indicate a problem

## Integration with Admin UI

The admin UI includes a "Refresh Site" button that triggers cache invalidation. This button is available in the site settings form and automatically triggers after saving settings.
