# Dependency Management System

This document explains how the dependency management system works in the Milo Presedo Portfolio application.

## Overview

The dependency management system allows you to:

1. Track all project dependencies
2. Monitor for outdated packages
3. Detect security vulnerabilities
4. Apply updates selectively
5. Configure update policies

## Database Tables

The system uses the following database tables:

- `dependencies`: Stores information about each dependency
- `dependency_settings`: Stores system-wide settings
- `security_audits`: Stores results of security scans

## Integration with Unified SQL Setup

The dependency system is fully integrated with the unified modular SQL setup system. The required tables are defined in `docs/setup/dependency-tables.sql` and can be created through the admin database setup interface.

### How It Works

1. When you visit the Security Center, the system checks if the required tables exist
2. If tables are missing, you'll see a setup button
3. The setup process uses the unified SQL setup system to create the necessary tables
4. After setup, you can scan for dependencies to populate the database

## Update Modes

Each dependency can have one of the following update modes:

- **Off**: No automatic updates
- **Conservative**: Only security patches
- **Aggressive**: All updates
- **Global**: Use the global setting

The global setting applies to all dependencies set to "Global" mode.

## Security Audits

The system can perform security audits to detect vulnerabilities in your dependencies. When a vulnerability is found:

1. The dependency is marked as having a security issue
2. Details about the vulnerability are stored
3. The security score is updated
4. The dashboard shows an alert

## API Routes

The system includes the following API routes:

- `/api/dependencies`: Get all dependencies
- `/api/dependencies/scan`: Scan for dependencies
- `/api/dependencies/setup`: Set up the dependency system
- `/api/dependencies/update-mode`: Update a dependency's update mode
- `/api/dependencies/audit`: Run a security audit
- `/api/dependencies/apply`: Apply pending updates

## Dashboard Widgets

The Security Center dashboard includes customizable widgets:

- Security Score
- Vulnerabilities
- Outdated Packages
- Update Settings
- Recent Activity
- Security Audit
- Update History
- Security Recommendations

You can add, remove, and rearrange these widgets to customize your dashboard.

## Troubleshooting

If you encounter issues with the dependency system:

1. Check if the database tables are set up correctly
2. Verify that your package.json file exists and is valid
3. Make sure npm is installed and accessible on the server
4. Check the server logs for more detailed error information

For persistent issues, you can try resetting the system by dropping the tables and setting up again.
\`\`\`

Now, let's update the code overview file to reflect our changes:
