# Troubleshooting Guide - Milo Website Builder

This guide helps you diagnose and resolve common issues when developing with Milo Website Builder.

## Quick Diagnostics

### Health Check Commands

```bash
# Check overall system status
npm run db:status

# Validate database schema
npm run db:validate

# Run basic tests
npm test -- --testPathPattern="basic"

# Check environment variables
node -e "console.log(process.env.NEXT_PUBLIC_SUPABASE_URL ? 'Supabase URL: ✓' : 'Supabase URL: ✗')"
```

### System Requirements Verification

```bash
# Check Node.js version (should be 18+)
node --version

# Check npm version
npm --version

# Check if ports are available
lsof -i :3000
```

## Common Issues

### 1. Environment Variable Issues

#### Missing Supabase Credentials

**Error**: `Missing Supabase environment variables`

**Solution**:
```bash
# Check if .env.local exists
ls -la .env.local

# Verify required variables
cat .env.local | grep SUPABASE

# Copy from example if missing
cp .env.example .env.local
```

**Required variables**:
```env
NEXT_PUBLIC_SUPABASE_URL=your-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

#### Clerk Authentication Issues

**Error**: `Clerk key is missing`

**Solution**:
1. Add Clerk keys to `.env.local`:
```env
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
```

2. Check Clerk dashboard for correct keys
3. Ensure domain is configured in Clerk settings

### 2. Database Connection Issues

#### Cannot Connect to Supabase

**Error**: `Failed to connect to database`

**Diagnosis**:
```bash
# Test database connection
npm run db:status

# Check Supabase project status
curl -I https://your-project.supabase.co/rest/v1/
```

**Solutions**:
1. **Check project status**: Verify your Supabase project is active
2. **Verify URL format**: Should be `https://project-id.supabase.co`
3. **Check API keys**: Ensure keys match your project
4. **Network issues**: Try from different network/VPN

#### Row Level Security (RLS) Issues

**Error**: `new row violates row-level security policy`

**Solution**:
1. **Check RLS policies**:
```sql
-- In Supabase SQL Editor
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename = 'your_table_name';
```

2. **Common RLS policy**:
```sql
-- Allow authenticated users to access their own data
CREATE POLICY "Users can access own data" ON your_table
FOR ALL USING (auth.uid() = user_id);
```

#### Missing Database Tables

**Error**: `Table 'table_name' does not exist`

**Solution**:
```bash
# Check which tables exist
npm run db:status

# Initialize missing tables
npm run db:setup

# Or visit the setup page
# http://localhost:3000/setup
```

### 3. Development Server Issues

#### Port Already in Use

**Error**: `EADDRINUSE: port 3000 already in use`

**Solutions**:
```bash
# Option 1: Use different port
npm run dev -- -p 3001

# Option 2: Kill process using port 3000
lsof -ti:3000 | xargs kill -9

# Option 3: Find and manually kill
lsof -i :3000
kill -9 [PID]
```

#### Module Not Found Errors

**Error**: `Cannot find module 'module-name'`

**Solutions**:
```bash
# Clear npm cache
npm cache clean --force

# Delete node_modules and reinstall
rm -rf node_modules package-lock.json
npm install

# Check for missing dependencies
npm ls
```

#### TypeScript Compilation Errors

**Error**: `Type errors in build`

**Solutions**:
```bash
# Check TypeScript configuration
npx tsc --noEmit

# Clear Next.js cache
rm -rf .next

# Restart TypeScript service in VS Code
# Cmd/Ctrl + Shift + P -> "TypeScript: Restart TS Server"
```

### 4. Media Upload Issues

#### File Upload Failures

**Error**: `Failed to upload file`

**Diagnosis**:
1. **Check file size**: Max size limits in Supabase
2. **Check file type**: Ensure allowed extensions
3. **Check storage bucket**: Verify bucket exists and is public

**Solutions**:
```bash
# Check storage bucket configuration
# In Supabase dashboard: Storage > Buckets

# Verify bucket policies
# Should allow authenticated uploads
```

#### WebP Conversion Issues

**Error**: `Sharp module not found` or conversion failures

**Solutions**:
```bash
# Reinstall sharp (platform-specific)
npm uninstall sharp
npm install sharp

# For Apple Silicon Macs
npm install --platform=darwin --arch=arm64 sharp

# Clear Next.js cache after sharp reinstall
rm -rf .next
```

### 5. Authentication Issues

#### Clerk Integration Problems

**Error**: User authentication failing

**Solutions**:
1. **Check Clerk configuration**:
   - Verify domain settings in Clerk dashboard
   - Ensure API keys are correct
   - Check allowed origins

2. **Clear authentication state**:
```bash
# Clear browser local storage
# In browser dev tools: Application > Local Storage > Clear

# Check middleware configuration
cat middleware.ts
```

#### Session Persistence Issues

**Problem**: Users getting logged out frequently

**Solutions**:
1. Check session configuration in Clerk
2. Verify cookie settings
3. Check for conflicting authentication middleware

### 6. Build and Deployment Issues

#### Next.js Build Failures

**Error**: Build fails with various errors

**Solutions**:
```bash
# Clear all caches
rm -rf .next node_modules package-lock.json
npm install
npm run build

# Check for TypeScript errors
npx tsc --noEmit

# Check for ESLint errors
npm run lint
```

#### Vercel Deployment Issues

**Error**: Deployment fails or runtime errors

**Solutions**:
1. **Check environment variables**: Ensure all required vars are set in Vercel
2. **Check function timeouts**: Increase if needed for large operations
3. **Check build logs**: Review build output for specific errors

### 7. Performance Issues

#### Slow Database Queries

**Problem**: Pages loading slowly

**Diagnosis**:
```sql
-- In Supabase SQL Editor, check slow queries
SELECT query, mean_exec_time, calls 
FROM pg_stat_statements 
ORDER BY mean_exec_time DESC 
LIMIT 10;
```

**Solutions**:
1. **Add database indexes**: For frequently queried columns
2. **Optimize queries**: Use `select` to limit returned columns
3. **Implement pagination**: For large datasets
4. **Use database functions**: For complex operations

#### Large Bundle Sizes

**Problem**: App loads slowly due to large JavaScript bundles

**Solutions**:
```bash
# Analyze bundle size
npm run build
npx @next/bundle-analyzer

# Check for large dependencies
npm ls --depth=0 | grep MB
```

## Advanced Diagnostics

### Database Debugging

```sql
-- Check table sizes
SELECT 
  schemaname,
  tablename,
  attname,
  n_distinct,
  correlation 
FROM pg_stats 
WHERE tablename = 'your_table';

-- Check index usage
SELECT 
  indexrelname,
  idx_tup_read,
  idx_tup_fetch 
FROM pg_stat_user_indexes;
```

### Network Debugging

```bash
# Test API endpoints
curl -X GET http://localhost:3000/api/health

# Test Supabase connection
curl -H "apikey: your-anon-key" \
  https://your-project.supabase.co/rest/v1/

# Check DNS resolution
nslookup your-project.supabase.co
```

### Application Debugging

```typescript
// Add debugging to components
console.log('Component state:', { props, state });

// Debug API routes
console.log('API Request:', { method, url, body });

// Debug database queries
console.log('Query result:', { data, error, count });
```

## Getting Help

### Documentation Resources

1. **[Setup Guide](./SETUP.md)** - Initial setup problems
2. **[Development Guide](./DEVELOPMENT.md)** - Development workflow issues
3. **[Code Overview](./CODE_OVERVIEW.md)** - Understanding system architecture
4. **[Database Setup](./DATABASE-SETUP.md)** - Database-specific issues

### Debug Information to Collect

When reporting issues, include:

```bash
# System information
node --version
npm --version
git branch
git log --oneline -5

# Environment check
ls -la .env*
npm run db:status

# Error logs
# Browser console errors
# Server console output
# Build output
```

### Common Log Locations

- **Browser Console**: F12 → Console tab
- **Server Console**: Terminal where you ran `npm run dev`
- **Vercel Logs**: Vercel dashboard → Functions tab
- **Supabase Logs**: Supabase dashboard → Database → Logs

## Prevention Tips

### Regular Maintenance

```bash
# Weekly dependency updates
npm outdated
npm update

# Monthly security audit
npm audit
npm audit fix

# Clear caches regularly
npm cache clean --force
rm -rf .next
```

### Development Best Practices

1. **Use TypeScript strictly** - Catch errors early
2. **Test locally first** - Before deploying
3. **Check logs regularly** - Monitor for warnings
4. **Keep dependencies updated** - Security and performance
5. **Use proper error handling** - Graceful failure modes
6. **Monitor performance** - Watch for degradation

## Emergency Procedures

### Complete Reset

If everything is broken:

```bash
# Nuclear option - fresh start
rm -rf node_modules package-lock.json .next
npm cache clean --force
npm install
cp .env.example .env.local
# Configure .env.local
npm run db:setup
npm run dev
```

### Rollback Procedures

```bash
# Revert to last working commit
git log --oneline -10
git reset --hard [commit-hash]

# Or create new branch from working commit
git checkout -b hotfix/emergency-fix [commit-hash]
```

This troubleshooting guide covers the most common issues. For specific problems not covered here, check the other documentation files or open an issue on GitHub with detailed debugging information.