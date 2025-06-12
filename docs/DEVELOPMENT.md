# Development Guide - Milo Website Builder

This guide covers the development workflow, best practices, and coding standards for contributing to the Milo Website Builder.

## Development Workflow

### Getting Started

1. **Environment Setup**: Follow the [Setup Guide](./SETUP.md)
2. **Code Exploration**: Review the [Code Overview](./CODE_OVERVIEW.md)
3. **Contributing**: Read the [Contributing Guidelines](./CONTRIBUTING.md)

### Daily Development

```bash
# Start development server
npm run dev

# Run tests in watch mode
npm test -- --watch

# Check code quality
npm run lint

# Validate database schema
npm run db:validate
```

### Branch Strategy

- **main**: Production-ready code
- **feature/**: New features (`feature/media-library-v2`)
- **fix/**: Bug fixes (`fix/upload-component-crash`)
- **refactor/**: Code improvements (`refactor/database-client`)
- **docs/**: Documentation updates (`docs/setup-guide`)

## Project Structure

```
milo.contact/
├── app/                    # Next.js App Router
│   ├── (admin)/           # Admin dashboard pages
│   ├── api/               # API routes
│   ├── globals.css        # Global styles
│   └── layout.tsx         # Root layout
├── components/            # Reusable React components
│   ├── ui/               # Base UI components
│   ├── admin/            # Admin-specific components
│   └── forms/            # Form components
├── lib/                  # Utility functions and shared code
│   ├── database/         # Database utilities
│   ├── auth-utils.ts     # Authentication helpers
│   └── supabase.ts       # Database client
├── docs/                 # Documentation
├── public/               # Static assets
├── scripts/              # Build and utility scripts
└── tests/                # Test files
```

## Development Standards

### TypeScript Usage

- **Strict mode enabled**: All code must pass TypeScript checks
- **Type definitions**: Use interfaces for object shapes
- **Avoid `any`**: Use proper types or `unknown` when necessary
- **Generic types**: Use generics for reusable components

```typescript
// Good
interface MediaItem {
  id: string;
  url: string;
  type: 'image' | 'video';
  metadata?: Record<string, unknown>;
}

// Avoid
const item: any = { ... };
```

### React Component Standards

- **Functional components**: Use hooks instead of class components
- **Props interface**: Define clear prop types
- **Destructuring**: Use destructuring for props
- **Single responsibility**: Keep components focused

```typescript
interface ButtonProps {
  variant: 'primary' | 'secondary';
  onClick: () => void;
  children: React.ReactNode;
  disabled?: boolean;
}

export function Button({ variant, onClick, children, disabled = false }: ButtonProps) {
  return (
    <button 
      className={`btn btn-${variant}`}
      onClick={onClick}
      disabled={disabled}
    >
      {children}
    </button>
  );
}
```

### CSS and Styling

- **Tailwind CSS**: Use utility classes for styling
- **Mobile-first**: Design for mobile, enhance for desktop
- **CSS variables**: Use for theming and consistency
- **Component variants**: Use class-variance-authority for component styling

```typescript
import { cva, type VariantProps } from "class-variance-authority";

const buttonVariants = cva(
  "inline-flex items-center justify-center rounded-md text-sm font-medium",
  {
    variants: {
      variant: {
        primary: "bg-blue-500 text-white hover:bg-blue-600",
        secondary: "bg-gray-200 text-gray-900 hover:bg-gray-300",
      },
      size: {
        sm: "h-8 px-3",
        md: "h-10 px-4",
        lg: "h-12 px-6",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "md",
    },
  }
);
```

## Database Development

### Schema Management

- **Centralized schema**: All table definitions in `lib/database/schema.ts`
- **Migration support**: Use database CLI tools for schema changes
- **RLS policies**: All tables must have Row Level Security enabled

```bash
# Check database status
npm run db:status

# Validate schema
npm run db:validate

# Generate migration scripts
npm run db:generate
```

### Database Client Usage

```typescript
import { createServerClient } from '@/lib/supabase-server';

// Server-side usage
const supabase = createServerClient();
const { data, error } = await supabase
  .from('media_library')
  .select('*')
  .eq('user_id', userId);
```

## API Development

### Route Conventions

- **RESTful design**: Follow REST principles
- **Error handling**: Consistent error responses
- **Authentication**: Use middleware for protected routes
- **Validation**: Validate input with Zod schemas

```typescript
// app/api/media/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

const createMediaSchema = z.object({
  url: z.string().url(),
  type: z.enum(['image', 'video']),
  title: z.string().min(1),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = createMediaSchema.parse(body);
    
    // Process request...
    
    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
```

## Testing Standards

### Test Structure

- **Unit tests**: Test individual functions and components
- **Integration tests**: Test API routes and database interactions
- **E2E tests**: Test complete user workflows (planned)

```bash
# Run specific test suites
npm test -- --testPathPattern="media"
npm test -- --testNamePattern="upload"

# Test with coverage
npm test -- --coverage
```

### Writing Tests

```typescript
import { render, screen, fireEvent } from '@testing-library/react';
import { MediaUploader } from '@/components/media/MediaUploader';

describe('MediaUploader', () => {
  it('should handle file upload', async () => {
    const onUpload = jest.fn();
    render(<MediaUploader onUpload={onUpload} />);
    
    const fileInput = screen.getByLabelText(/upload file/i);
    const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
    
    fireEvent.change(fileInput, { target: { files: [file] } });
    
    expect(onUpload).toHaveBeenCalledWith(file);
  });
});
```

## Performance Guidelines

### Component Optimization

- **React.memo**: Use for expensive components
- **useMemo/useCallback**: Cache expensive calculations
- **Code splitting**: Use dynamic imports for large components
- **Image optimization**: Use Next.js Image component

### Database Optimization

- **Query optimization**: Use indexes and efficient queries
- **Pagination**: Implement pagination for large datasets
- **Caching**: Use appropriate caching strategies
- **Connection pooling**: Manage database connections efficiently

## Security Best Practices

### Authentication & Authorization

- **RLS policies**: Implement Row Level Security on all tables
- **Input validation**: Validate all user inputs
- **CSRF protection**: Use proper CSRF tokens
- **Environment variables**: Never commit secrets

### Data Protection

- **Sanitize inputs**: Clean user-provided data
- **Escape outputs**: Prevent XSS attacks
- **Secure headers**: Use appropriate security headers
- **Rate limiting**: Implement rate limiting on API routes

## Development Tools

### Recommended VS Code Extensions

- **TypeScript**: Enhanced TypeScript support
- **Tailwind CSS IntelliSense**: Tailwind class autocomplete
- **ES7+ React/Redux/React-Native**: React snippets
- **Prettier**: Code formatting
- **ESLint**: Code linting

### Debugging

```bash
# Debug with Chrome DevTools
NODE_OPTIONS='--inspect' npm run dev

# Debug specific components
console.log('Debug info:', { data, error });

# Database debugging
npm run db:status
npm run db:validate
```

## Common Development Tasks

### Adding a New Component

1. Create component file in appropriate directory
2. Define TypeScript interfaces
3. Implement component with proper styling
4. Add Storybook story (if applicable)
5. Write unit tests
6. Update documentation

### Adding a New API Route

1. Create route file in `app/api/`
2. Implement proper error handling
3. Add input validation with Zod
4. Write integration tests
5. Update API documentation

### Adding a Database Table

1. Add table definition to `lib/database/schema.ts`
2. Generate migration script with `npm run db:generate`
3. Test schema validation
4. Update related components and APIs
5. Write database tests

## Getting Help

- **Documentation**: Check the relevant docs in `/docs`
- **Code Examples**: Look at existing components for patterns
- **Issues**: Search existing GitHub issues
- **Team**: Ask questions in team communication channels

## Best Practices Summary

1. **Follow TypeScript strictly** - No `any` types
2. **Test your changes** - Write and run tests
3. **Document as you go** - Update docs with changes
4. **Security first** - Always validate inputs and outputs
5. **Performance matters** - Optimize for speed and efficiency
6. **Mobile responsive** - Test on different screen sizes
7. **Accessibility** - Use semantic HTML and ARIA attributes
8. **Code review** - Get your changes reviewed before merging