# GitHub Copilot Instructions for milo.contact

## Project Overview
This is a portfolio website built with Next.js, TypeScript, Tailwind CSS, and Supabase. The project features a comprehensive database management system with centralized schema management, real-time validation, and testing capabilities.

## Development Guidelines

### Package Management
- **Use pnpm as primary package manager**: The project uses `pnpm` for faster installs and better disk space usage
- **ALWAYS use exact React 18.3.1**: `"react": "18.3.1"`, `"react-dom": "18.3.1"`, and `"@types/react": "18.3.12"`
- **For Vercel deployment**: Use `npm install --legacy-peer-deps` in build settings if pnpm fails
- **NEVER use "latest" versions**: Always specify exact or caret versions to avoid conflicts
- **Remove problematic dependencies**: Never include non-Next.js framework dependencies:
  - ❌ `@remix-run/react`, `@sveltejs/kit`, `svelte`, `vue`, `vue-router`
  - ❌ Node.js core modules in dependencies: `fs`, `path`, `crypto`, `util`, `child_process`
  - ❌ Any package that requires React 19 when using React 18.3.1

### Build System
- **Development**: Use `pnpm dev`, `pnpm build`, `pnpm start`
- **Production/Vercel**: Configure build command as `npm install --legacy-peer-deps && npm run build`
- **Critical build commands**:
  ```bash
  pnpm install           # Install dependencies
  pnpm run build         # Build application  
  pnpm run dev           # Development server
  pnpm run lint          # Lint code
  pnpm run test          # Run tests
  ```
- **Dependency conflict resolution**:
  ```bash
  # Clean install when package.json changes
  rm -rf node_modules package-lock.json pnpm-lock.yaml
  pnpm install
  
  # For stubborn conflicts in production
  npm install --legacy-peer-deps
  
  # Verify no React version conflicts
  npm ls react react-dom
  ```

### Database Management
- **Centralized schema**: All table definitions in `lib/database/schema.ts`
- **Migration safety**: Always handle NOT NULL columns carefully for existing tables:
  1. Add column as nullable first
  2. Update existing rows with default values
  3. Then add NOT NULL constraint
- **Testing configurations**: Use predefined test setups (minimal, basic, full, development)
- **CLI tools available**:
  ```bash
  npm run db:validate    # Check database status
  npm run db:generate    # Generate SQL scripts
  npm run db:test basic  # Create test database
  ```

### Code Style
- **TypeScript strict mode**: Always use proper typing
- **Supabase patterns**: Use `createClientComponentClient()` for client-side operations
- **Error handling**: Wrap database operations in try-catch blocks
- **Component structure**: Prefer composition over inheritance

### File Structure
```
lib/database/
  ├── schema.ts          # Centralized table definitions
  ├── validator.ts       # Database validation system  
  └── testing.ts         # Testing utilities

components/admin/
  └── compact-database-manager.tsx  # Main database UI

app/api/database/
  ├── validate/route.ts  # Validation API
  └── testing/route.ts   # Testing API
```

### Common Issues & Solutions

1. **Dependency conflicts**: 
   - Use exact React 18.3.1, never React 19
   - Remove framework-specific dependencies (@remix-run/react, @sveltejs/kit, etc.)
   - Use specific versions instead of "latest"
   - For Vercel builds: `npm install --legacy-peer-deps && npm run build`

2. **Build failures**:
   - Clean install: `rm -rf node_modules *.lock && pnpm install`
   - Check React versions: `npm ls react react-dom`
   - Ensure all imports are properly typed
   - Remove unused dependencies from package.json

3. **Database migration errors**:
   - Handle NOT NULL constraints properly for existing tables
   - Use default values for new columns
   - Test migrations on development database first

4. **Font loading issues**:
   - `fonts.googleapis.com` may be blocked in some environments
   - Provide fallback fonts in Tailwind config

### Testing Strategy
- **Unit tests**: Focus on database utilities and validation logic
- **Integration tests**: Test API endpoints with mock Supabase client
- **Database tests**: Use testing configurations for safe testing

### Performance Considerations
- **Auto-refresh**: Implement smart refresh intervals (30s for database status)
- **Lazy loading**: Load heavy components only when needed
- **Error boundaries**: Wrap database operations in error boundaries

## AI Assistant Guidelines

When working on this project:

1. **Always check package.json** before installing new dependencies
2. **Use the existing database schema system** instead of creating new tables manually
3. **Follow the migration patterns** for safe database updates
4. **Test locally** before suggesting production changes
5. **Prefer minimal changes** that maintain existing functionality
6. **Document breaking changes** clearly in commit messages

## Quick Commands for AI Assistants

```bash
# Setup development environment
pnpm install
pnpm run dev

# Database operations
npm run db:validate
npm run db:generate basic

# Testing
pnpm run test
pnpm run build

# Check project status
git status
pnpm run lint
```

Remember: This project prioritizes developer experience and database safety. Always test changes thoroughly!