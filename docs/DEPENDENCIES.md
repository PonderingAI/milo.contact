# Dependency Management

This document describes the dependency management system used in the Milo Presedo portfolio project.

## Overview

The dependency management system provides a comprehensive dashboard for monitoring and managing your project's dependencies. It allows you to:

1. View all installed dependencies
2. Check for outdated dependencies
3. Detect security vulnerabilities
4. Set update policies for each dependency
5. Apply updates manually or automatically

## Features

### Real-time Dependency Monitoring

The system uses `npm ls`, `npm outdated`, and `npm audit` to provide real-time information about your dependencies, including:

- Current installed version
- Latest available version
- Security vulnerabilities
- Update recommendations

### Update Modes

Each dependency can be configured with one of the following update modes:

- **Global**: Follow the global update policy (default)
- **Manual**: Never update automatically
- **Automatic**: Always update to the latest version
- **Security Only**: Only update when security vulnerabilities are found

### Locking Dependencies

You can lock specific dependencies to prevent them from being updated. This is useful for dependencies that:

- Have breaking changes in newer versions
- Are critical to your application's stability
- Require extensive testing before updating

### Security Auditing

The system automatically runs security audits to detect vulnerabilities in your dependencies. It provides:

- A security score based on the number and severity of vulnerabilities
- Detailed information about each vulnerability
- Recommendations for fixing security issues

## Database Structure

The system uses the following database tables:

### Dependencies Table

Stores information about each dependency:

\`\`\`sql
CREATE TABLE dependencies (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL UNIQUE,
  current_version VARCHAR(100) NOT NULL,
  latest_version VARCHAR(100),
  locked BOOLEAN DEFAULT FALSE,
  locked_version VARCHAR(100),
  update_mode VARCHAR(50) DEFAULT 'global',
  last_checked TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  has_security_update BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
\`\`\`

### Dependency Settings Table

Stores global settings for dependency management:

\`\`\`sql
CREATE TABLE dependency_settings (
  id SERIAL PRIMARY KEY,
  update_mode VARCHAR(50) DEFAULT 'conservative',
  auto_update_enabled BOOLEAN DEFAULT FALSE,
  update_schedule VARCHAR(100) DEFAULT 'daily',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
\`\`\`

## API Endpoints

The system provides the following API endpoints:

- `GET /api/dependencies/list`: Lists all installed dependencies
- `GET /api/dependencies/check-updates`: Checks for available updates
- `GET /api/dependencies/audit`: Runs a security audit
- `POST /api/dependencies/update`: Updates a specific dependency
- `POST /api/dependencies/apply`: Applies all pending updates

## Usage

### Viewing Dependencies

The dependencies page shows all installed dependencies with their current and latest versions. Dependencies with available updates are highlighted.

### Updating Dependencies

You can update dependencies in several ways:

1. **Manual Update**: Click the "Update" button next to a specific dependency
2. **Apply Updates**: Click the "Apply Updates Now" button to update all eligible dependencies
3. **Scheduled Updates**: Configure the system to automatically apply updates on a schedule

### Setting Update Policies

To set an update policy for a dependency:

1. Select the desired update mode from the dropdown menu
2. The change is saved automatically

### Locking Dependencies

To lock a dependency:

1. Check the "Locked" checkbox next to the dependency
2. The dependency will not be updated automatically

## Integration with Other Systems

The dependency management system works alongside:

1. **GitHub's Dependabot**: Complementary functionality for dependency updates
2. **npm**: Uses npm commands for accurate dependency information
3. **Supabase**: Stores dependency settings and update history

## Troubleshooting

If you encounter issues with the dependency management system:

1. **Database Tables Missing**: Use the "Show Setup SQL" button to create the necessary tables
2. **Dependencies Not Showing**: Click the "Refresh Dependencies" button to reload the data
3. **Updates Not Working**: Check the console for error messages and ensure you have write access to the package.json file
\`\`\`

Let's create a simple API endpoint to check if the database tables exist:
