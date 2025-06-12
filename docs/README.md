# Milo Website Builder - Technical Deep Dive

This document provides comprehensive technical documentation for the Milo Website Builder framework. For getting started, see the main [README](../README.md).

## Architecture Overview

Milo follows a modular, component-based architecture built on modern web technologies:

```
Milo Framework Architecture
├── Frontend Layer (Next.js 15 + React 18)
│   ├── App Router (app/)
│   ├── Component System (components/)
│   └── UI Library (Radix UI + Tailwind CSS)
├── Backend Layer (Next.js API Routes)
│   ├── Authentication (Clerk)
│   ├── Database (Supabase)
│   └── File Storage (Supabase Storage)
├── Data Layer
│   ├── PostgreSQL (via Supabase)
│   ├── Real-time subscriptions
│   └── Row Level Security (RLS)
└── Development Tools
    ├── TypeScript (strict mode)
    ├── Testing (Jest + React Testing Library)
    └── Database CLI tools
```

## Core Technologies

### Frontend Stack
- **Next.js 15**: React framework with App Router
- **React 18**: UI library with concurrent features
- **TypeScript**: Type safety and developer experience
- **Tailwind CSS**: Utility-first CSS framework
- **Radix UI**: Accessible component primitives
- **Framer Motion**: Animation library

### Backend Stack
- **Supabase**: PostgreSQL database with real-time features
- **Clerk**: Authentication and user management
- **Next.js API Routes**: Serverless API endpoints
- **Zod**: Runtime type validation
- **Sharp**: Image processing and optimization

## Component System

Milo's component system is designed for maximum reusability and type safety:

### Component Structure

```typescript
// Base component interface
interface ComponentProps {
  id?: string;
  className?: string;
  children?: React.ReactNode;
}

// Component with variants
interface ButtonProps extends ComponentProps {
  variant: 'primary' | 'secondary' | 'outline';
  size: 'sm' | 'md' | 'lg';
  onClick: () => void;
  disabled?: boolean;
}
```

### Built-in Components

#### Layout Components
- **Hero Section**: Full-screen banners with customizable backgrounds
- **About Section**: Flexible about sections with image support
- **Navigation**: Responsive navigation with mobile support

#### Content Components  
- **Features Grid**: Service/feature showcases with icons
- **Contact Form**: Contact sections with form validation
- **Media Gallery**: Image and video galleries with lightbox

#### Form Components
- **Input Fields**: Text, email, password, textarea inputs
- **Select Dropdowns**: Single and multi-select options
- **File Upload**: Drag-and-drop file upload with progress
- **Form Validation**: Real-time validation with error states

### Component Development

```typescript
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const componentVariants = cva(
  "base-classes",
  {
    variants: {
      variant: {
        primary: "variant-specific-classes",
        secondary: "variant-specific-classes",
      },
      size: {
        sm: "size-specific-classes",
        lg: "size-specific-classes",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "sm",
    },
  }
);

interface ComponentProps 
  extends React.HTMLAttributes<HTMLElement>,
    VariantProps<typeof componentVariants> {
  // Additional props
}

export function Component({ 
  variant, 
  size, 
  className, 
  ...props 
}: ComponentProps) {
  return (
    <div 
      className={cn(componentVariants({ variant, size }), className)}
      {...props}
    />
  );
}
```

## Database Architecture

Milo uses Supabase (PostgreSQL) with a well-defined schema and Row Level Security:

### Core Tables

```sql
-- Site settings and configuration
CREATE TABLE site_settings (
  key TEXT PRIMARY KEY,
  value TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Media library for images and videos
CREATE TABLE media_library (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  filename TEXT NOT NULL,
  original_filename TEXT,
  file_path TEXT NOT NULL,
  file_size BIGINT,
  mime_type TEXT,
  width INTEGER,
  height INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Project management
CREATE TABLE projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  name TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Row Level Security (RLS)

All tables implement RLS policies for secure data access:

```sql
-- Example: Users can only access their own media
CREATE POLICY "Users can access own media" ON media_library
FOR ALL USING (auth.uid() = user_id);

-- Example: Site settings are publicly readable, admin writable
CREATE POLICY "Public read access" ON site_settings
FOR SELECT USING (true);

CREATE POLICY "Admin write access" ON site_settings
FOR ALL USING (auth.jwt() ->> 'role' = 'admin');
```

## API Architecture

### RESTful API Design

```typescript
// GET /api/media - List media items
// POST /api/media - Upload new media
// PUT /api/media/[id] - Update media item
// DELETE /api/media/[id] - Delete media item

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get('page') || '1');
  const limit = parseInt(searchParams.get('limit') || '10');
  
  const supabase = createServerClient();
  const { data, error, count } = await supabase
    .from('media_library')
    .select('*', { count: 'exact' })
    .range((page - 1) * limit, page * limit - 1)
    .order('created_at', { ascending: false });
    
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  
  return NextResponse.json({
    data,
    pagination: {
      page,
      limit,
      total: count,
      pages: Math.ceil(count / limit)
    }
  });
}
```

### Authentication Integration

```typescript
import { auth } from '@clerk/nextjs';
import { createServerClient } from '@/lib/supabase-server';

export async function POST(request: NextRequest) {
  const { userId } = auth();
  
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  const supabase = createServerClient();
  // Database operations with authenticated user context
}

## Media Management System

### File Upload and Processing

```typescript
// Automatic WebP conversion for images
import sharp from 'sharp';

export async function processImage(file: File): Promise<Buffer> {
  const buffer = Buffer.from(await file.arrayBuffer());
  
  return await sharp(buffer)
    .webp({ quality: 90 })
    .resize(1920, 1080, { 
      fit: 'inside', 
      withoutEnlargement: true 
    })
    .toBuffer();
}
```

### Storage Architecture

- **Upload Flow**: Client → API Route → Supabase Storage
- **URL Generation**: Signed URLs for secure access
- **Optimization**: Automatic WebP conversion and resizing
- **Metadata**: Extracted and stored in database

### Supported Media Types

- **Images**: JPEG, PNG, WebP, GIF, SVG
- **Videos**: MP4, WebM, Vimeo embeds, YouTube embeds
- **Documents**: PDF (planned)
- **Archives**: ZIP extraction for batch uploads

## Theme System

### CSS Custom Properties

```css
:root {
  /* Primary colors */
  --primary-50: 239 246 255;
  --primary-500: 59 130 246;
  --primary-900: 30 58 138;
  
  /* Semantic colors */
  --background: 0 0% 100%;
  --foreground: 222.2 84% 4.9%;
  --card: 0 0% 100%;
  --card-foreground: 222.2 84% 4.9%;
}

[data-theme="dark"] {
  --background: 222.2 84% 4.9%;
  --foreground: 210 40% 98%;
  --card: 222.2 84% 4.9%;
  --card-foreground: 210 40% 98%;
}
```

### Theme Configuration

```typescript
interface ThemeConfig {
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
    foreground: string;
  };
  typography: {
    fontFamily: {
      sans: string[];
      serif: string[];
      mono: string[];
    };
    fontSize: Record<string, [string, string]>;
  };
  spacing: Record<string, string>;
  borderRadius: Record<string, string>;
}
```

## Development Tools

### Database CLI

```bash
# Check database status
npm run db:status

# Validate schema against database
npm run db:validate

# Generate migration scripts
npm run db:generate

# Test database operations
npm run db:test
```

### Testing Framework

```typescript
// Component testing
import { render, screen, fireEvent } from '@testing-library/react';
import { MediaUploader } from '@/components/MediaUploader';

test('should upload file successfully', async () => {
  const onUpload = jest.fn();
  render(<MediaUploader onUpload={onUpload} />);
  
  const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
  const input = screen.getByLabelText(/upload/i);
  
  fireEvent.change(input, { target: { files: [file] } });
  
  await waitFor(() => {
    expect(onUpload).toHaveBeenCalledWith(file);
  });
});
```

## Performance Optimization

### Code Splitting

```typescript
// Dynamic imports for large components
const AdminDashboard = dynamic(() => import('@/components/AdminDashboard'), {
  loading: () => <div>Loading dashboard...</div>,
  ssr: false
});

// Route-based code splitting (automatic with App Router)
// app/admin/dashboard/page.tsx
export default function DashboardPage() {
  return <AdminDashboard />;
}
```

### Image Optimization

```typescript
import Image from 'next/image';

// Optimized images with Next.js
export function OptimizedImage({ src, alt, ...props }) {
  return (
    <Image
      src={src}
      alt={alt}
      width={800}
      height={600}
      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
      priority={props.priority}
      placeholder="blur"
      blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQ..."
      {...props}
    />
  );
}
```

### Database Query Optimization

```typescript
// Efficient queries with proper indexing
const { data } = await supabase
  .from('media_library')
  .select(`
    id,
    filename,
    file_path,
    created_at,
    projects:project_id (
      id,
      name
    )
  `)
  .eq('user_id', userId)
  .order('created_at', { ascending: false })
  .range(0, 9); // Pagination for performance
```

## Security Features

### Input Validation

```typescript
import { z } from 'zod';

const createMediaSchema = z.object({
  filename: z.string().min(1).max(255),
  file_size: z.number().positive().max(50 * 1024 * 1024), // 50MB max
  mime_type: z.enum(['image/jpeg', 'image/png', 'image/webp']),
  metadata: z.record(z.unknown()).optional()
});

// Usage in API route
const validatedData = createMediaSchema.parse(requestBody);
```

### Content Security Policy

```typescript
// next.config.mjs
const securityHeaders = [
  {
    key: 'Content-Security-Policy',
    value: `
      default-src 'self';
      script-src 'self' 'unsafe-eval' 'unsafe-inline';
      style-src 'self' 'unsafe-inline';
      img-src 'self' data: blob: https://*.supabase.co;
      font-src 'self';
      connect-src 'self' https://*.supabase.co wss://*.supabase.co;
    `.replace(/\s{2,}/g, ' ').trim()
  }
];
```

## Deployment Architecture

### Vercel Deployment

```json
{
  "version": 2,
  "build": {
    "env": {
      "NEXT_TELEMETRY_DISABLED": "1"
    }
  },
  "functions": {
    "app/api/**/*.js": {
      "maxDuration": 30
    }
  },
  "regions": ["iad1"]
}
```

### Environment Configuration

```bash
# Production environment variables
NEXT_PUBLIC_SUPABASE_URL=https://project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_live_...
CLERK_SECRET_KEY=sk_live_...
```

## Advanced Features

### Real-time Subscriptions

```typescript
// Real-time updates for collaborative editing
useEffect(() => {
  const channel = supabase
    .channel('media_changes')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'media_library'
      },
      (payload) => {
        console.log('Change received!', payload);
        // Update local state
        setMediaItems(current => 
          updateMediaList(current, payload)
        );
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}, []);
```

### Plugin System (Planned)

```typescript
interface Plugin {
  name: string;
  version: string;
  install(): Promise<void>;
  uninstall(): Promise<void>;
  components: Record<string, React.ComponentType>;
  hooks: Record<string, Function>;
}

// Plugin registration
export function registerPlugin(plugin: Plugin) {
  PluginManager.register(plugin);
}
```

## Migration and Scaling

### Database Migrations

```sql
-- Migration script example
-- Migration: 001_add_media_metadata.sql

ALTER TABLE media_library 
ADD COLUMN metadata JSONB DEFAULT '{}';

CREATE INDEX idx_media_metadata 
ON media_library USING gin (metadata);

-- Update RLS policy to include metadata access
DROP POLICY IF EXISTS "Users can access own media" ON media_library;
CREATE POLICY "Users can access own media" ON media_library
FOR ALL USING (auth.uid() = user_id);
```

### Horizontal Scaling

- **CDN Integration**: Static assets via Vercel Edge Network
- **Database Read Replicas**: For high-traffic applications
- **Function Regions**: Deploy API routes closer to users
- **Cache Layers**: Redis for session and query caching

For implementation guides and getting started, see:
- [Setup Guide](./SETUP.md) - Development environment setup
- [Development Guide](./DEVELOPMENT.md) - Development workflow
- [Contributing Guide](./CONTRIBUTING.md) - How to contribute
