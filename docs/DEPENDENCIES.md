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

The system supports three update modes:

1. **Off**: No automatic updates will be applied
2. **Security Only**: Only security-related updates will be applied
3. **All Updates**: All available updates will be applied

These modes can be set globally or per-package.

**Important**: Packages with Dependabot alerts will be updated automatically regardless of update mode settings to protect your application from security vulnerabilities.

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
