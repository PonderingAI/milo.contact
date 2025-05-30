# Dependency Management System

This document outlines the dependency management system implemented in the portfolio application.

## Overview

The dependency management system provides tools for:

1. **Tracking Dependencies**: Automatically scans and tracks all project dependencies
2. **Vulnerability Detection**: Identifies security vulnerabilities in dependencies
3. **Update Management**: Configurable update policies to keep dependencies secure
4. **Visualization**: Dashboard for monitoring dependency health and security

## Features

### Dependency Scanning

The system automatically scans your project's dependencies and provides:

- Current and latest versions
- Outdated package detection
- Security vulnerability identification
- Dependabot alert integration

### Update Management

The system supports three update modes, which can be set globally or per-package:

1.  **Off**: No automatic updates will be applied. The system will not attempt to update any dependencies unless specifically triggered by a Dependabot alert.
2.  **Conservative**: Updates packages to their latest minor version if a newer minor version is available. This mode applies to both security updates and general dependency maintenance. All updates in this mode are subject to a verification process (build and tests) via the `safe-update` mechanism to ensure compatibility.
3.  **Aggressive**: Updates packages to their latest available version. These updates are also subject to the same verification process (build and tests) via `safe-update` to prevent conflicts or breakages.

**Dependabot Alert Handling**: Packages with active Dependabot alerts are prioritized. The system will attempt to update them to the *Dependabot recommended version* if this information is available. If a specific recommended version is not provided by the alert, the system will attempt an update to the latest available version of the package. All Dependabot-triggered updates are processed through the `safe-update` mechanism, including its build and test verification steps, regardless of the global or per-package update mode settings.

**Conflict Detection and `safe-update` Mechanism**:
The system employs a robust `safe-update` mechanism to handle potential dependency conflicts and ensure application stability during updates. This process includes the following steps:
1.  **Backup**: Before any changes are made, the current `package.json` file is backed up.
2.  **Update Attempt**: The system attempts to update the specified dependency/dependencies according to the chosen mode.
3.  **Verification**: After the update attempt, the system automatically runs a full application build and executes any configured automated tests.
4.  **Rollback**: If the build process fails or any automated test fails, the `safe-update` mechanism automatically restores the `package.json` from the backup and rolls back the installed dependencies to their previous state.
This ensures that problematic updates do not break the application, maintaining a stable development environment.

### Security Dashboard

The Security Dashboard provides a visual interface for monitoring and managing dependencies with:

- **Customizable Layout**: Add, remove, and rearrange widgets
- **Masonry Layout**: Widgets automatically arrange to fill available space efficiently
- **Persistent State**: Dashboard layout and settings are saved between sessions
- **Real-time Updates**: Dashboard updates as dependencies change

### Widgets

Available widgets include:

- **Security Score**: Overall security rating
- **Vulnerabilities**: Known security issues
- **Dependabot Alerts**: GitHub Dependabot security alerts
- **Outdated Packages**: Dependencies needing updates
- **Global Update Settings**: Configure automatic update behavior
- **Recent Activity**: Latest security events and actions
- **Security Audit**: Run security scans
- **Update History**: Recent package updates
- **Security Recommendations**: Suggested security improvements

## Implementation

The dependency management system is implemented using:

- **API Routes**: Server-side API routes for scanning and updating dependencies
- **React Components**: Client-side components for visualizing dependency information
- **Local Storage**: Persists dashboard layout and settings between sessions
- **Masonry Layout**: Efficiently organizes widgets to fill available space

## Usage

### Scanning Dependencies

To scan dependencies:

1. Navigate to the Security Dashboard
2. Click "Scan Dependencies" button

### Applying Updates

To apply updates:

1. Navigate to the Security Dashboard
2. Click "Apply Updates" button

### Configuring Update Mode

To configure the global update mode:

1. Navigate to the Security Dashboard
2. Find the "Global Update Settings" widget
3. Select desired update mode

To configure per-package update mode:

1. Navigate to the Dependencies tab
2. Find the package in the list
3. Set the update mode using the toggle

## Best Practices

1. **Regular Scans**: Run dependency scans regularly
2. **Prompt Updates**: Apply security updates promptly
3. **Review Dependencies**: Regularly audit dependencies to remove unused packages
4. **Monitor Alerts**: Pay special attention to Dependabot alerts
