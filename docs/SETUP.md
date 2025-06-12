# Setup Guide - Milo Website Builder

This guide will help you set up the Milo Website Builder development environment from scratch.

## Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js 18+** and npm
- **Git** for version control
- **Supabase account** (free tier available)
- **Vercel account** (for deployment, optional)

## Environment Setup

### 1. Clone the Repository

```bash
git clone https://github.com/PonderingAI/milo.contact.git
cd milo.contact
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Environment Variables

Create a `.env.local` file in the root directory:

```bash
cp .env.example .env.local
```

Add the following environment variables:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your-supabase-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key

# Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your-clerk-publishable-key
CLERK_SECRET_KEY=your-clerk-secret-key

# Security
BOOTSTRAP_SECRET=your-random-bootstrap-secret

# Optional: Analytics
NEXT_PUBLIC_VERCEL_ANALYTICS_ID=your-analytics-id
```

### 4. Supabase Setup

1. Create a new project at [supabase.com](https://supabase.com)
2. Copy your project URL and anon key to `.env.local`
3. Generate a service role key in Project Settings > API
4. Enable Row Level Security (RLS) on all tables

### 5. Database Initialization

Initialize the database tables and storage:

```bash
# Option 1: Automated setup
npm run db:setup

# Option 2: Manual setup via web interface
npm run dev
# Visit http://localhost:3000/setup
```

### 6. Start Development Server

```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000) to see your application.

## Setup Options

### Option 1: Full Development Setup

Complete setup with all features enabled:

```bash
git clone https://github.com/PonderingAI/milo.contact.git
cd milo.contact
npm install
cp .env.example .env.local
# Configure .env.local with your credentials
npm run db:setup
npm run dev
```

### Option 2: CLI-based Setup

Quick project scaffolding:

```bash
npm install -g @milo/cli
milo create my-project
cd my-project
milo dev
```

### Option 3: Docker Development

Containerized development environment:

```bash
git clone https://github.com/PonderingAI/milo.contact.git
cd milo.contact
docker compose up -d
```

### Option 4: Database Only

Setup just the database infrastructure:

```bash
npm install
cp .env.example .env.local
# Configure database credentials only
npm run db:setup
```

## Verification

### Test Your Setup

1. **Frontend**: Visit [http://localhost:3000](http://localhost:3000)
2. **Admin Panel**: Visit [http://localhost:3000/admin](http://localhost:3000/admin)
3. **API Health**: Visit [http://localhost:3000/api/health](http://localhost:3000/api/health)
4. **Database**: Run `npm run db:status`

### Run Tests

```bash
# Run all tests
npm test

# Run database validation
npm run db:validate

# Test specific components
npm test -- --testNamePattern="Component Name"
```

## Common Setup Issues

### Missing Environment Variables

**Problem**: Application fails to start with missing env vars

**Solution**: 
```bash
# Check your .env.local file
cat .env.local

# Verify all required variables are set
npm run dev
```

### Database Connection Issues

**Problem**: Cannot connect to Supabase

**Solution**:
1. Verify your Supabase URL and keys
2. Check project status at supabase.com
3. Ensure RLS is properly configured

### Port Already in Use

**Problem**: Port 3000 is already occupied

**Solution**:
```bash
# Use a different port
npm run dev -- -p 3001

# Or kill the process using port 3000
lsof -ti:3000 | xargs kill -9
```

## Next Steps

Once your environment is set up:

1. Review the [Development Guide](./DEVELOPMENT.md)
2. Explore the [Code Overview](./CODE_OVERVIEW.md)
3. Check out the [Contributing Guidelines](./CONTRIBUTING.md)
4. Read about [Media Management](./MEDIA-STORAGE.md)

## Getting Help

- **Documentation**: Check the [Troubleshooting Guide](./TROUBLESHOOTING.md)
- **Issues**: Open an issue on GitHub
- **Questions**: Review existing documentation in the `docs/` folder

## Advanced Configuration

### Custom Database Configuration

For advanced database setups, see [Database Management](./DATABASE-MANAGEMENT.md).

### Production Deployment

For production deployment instructions, see [Deployment Guide](./DEPLOYMENT.md).

### Security Configuration

For security best practices, see [Security Guide](./SECURITY.md).