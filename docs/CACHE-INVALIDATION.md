# Cache Invalidation System

This document explains the cache invalidation system implemented in the portfolio site. The system allows for efficient updates to content without requiring a full page reload or deployment.

## Overview

The cache invalidation system consists of:

1. A reusable utility library (`lib/cache-utils.ts`)
2. An API endpoint for revalidation (`app/api/revalidate/route.ts`)
3. Integration with Next.js's built-in cache invalidation

## How It Works

When content is updated in the admin panel, the system can trigger a cache invalidation to ensure the changes are immediately visible on the frontend.

### Cache Utility Functions

The `lib/cache-utils.ts` file provides several utility functions:

- `invalidateCache(path?)`: Invalidates the cache for a specific path or the entire site
- `invalidateMultiplePaths(paths)`: Invalidates multiple paths at once
- `commonInvalidations`: Pre-configured invalidation patterns for common scenarios

### Usage Examples

#### Basic Usage

\`\`\`typescript
import { invalidateCache } from '@/lib/cache-utils';

// Invalidate the home page
await invalidateCache('/');
\`\`\`

#### Using Common Invalidation Patterns

\`\`\`typescript
import { commonInvalidations } from '@/lib/cache-utils';

// Invalidate site settings (affects multiple pages)
await commonInvalidations.siteSettings();
\`\`\`

#### Invalidating Multiple Paths

\`\`\`typescript
import { invalidateMultiplePaths } from '@/lib/cache-utils';

// Invalidate specific paths
await invalidateMultiplePaths(['/projects', '/about', '/contact']);
\`\`\`

## Integration Points

The cache invalidation system is integrated at several points:

1. **Admin Settings Form**: Automatically refreshes the site when settings are saved
2. **Project Management**: Refreshes relevant pages when projects are created, updated, or deleted
3. **Media Library**: Refreshes pages when media items that affect the site are updated

## Security Considerations

The revalidation API endpoint includes security checks to ensure only authenticated admin users can trigger cache invalidation. In production, it verifies:

1. The presence of an authorization header
2. The validity of the provided token
3. That the user has admin privileges

## Performance Considerations

To minimize Edge Middleware invocations and optimize performance:

1. Group related invalidations together when possible
2. Use the most specific path possible (e.g., `/projects/123` instead of `/projects`)
3. Consider the timing of invalidations (e.g., batch updates together)

## Troubleshooting

If changes are not appearing on the frontend after updates:

1. Check the browser console for any errors in the revalidation process
2. Verify that the correct paths are being invalidated
3. Try using the "Refresh Site" button in the admin panel
4. As a last resort, clear your browser cache or do a hard refresh (Ctrl+F5)
