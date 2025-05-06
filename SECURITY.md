# Security Policy

## Reporting a Vulnerability

If you discover a security vulnerability within this project, please send an email to security@example.com. All security vulnerabilities will be promptly addressed.

## Security Features

### Dependency Management

The application includes a comprehensive security center that helps you manage dependencies and security vulnerabilities:

- **Automatic Vulnerability Detection**: The system automatically scans dependencies for known security vulnerabilities using npm audit data.
- **Security Score**: A calculated score based on the number and severity of vulnerabilities in your dependencies.
- **Update Modes**: Configure how dependencies are updated:
  - **Off**: No automatic updates
  - **Security Only**: Only security-related updates are applied
  - **All Updates**: All updates are applied
  - **Global**: Follow the global setting

### Update Policies

You can set update policies at both the global and individual dependency level:

1. **Global Policy**: Sets the default behavior for all dependencies
2. **Individual Policies**: Override the global policy for specific dependencies

### Security Audit

Run security audits to check for new vulnerabilities in your dependencies. The system will:

1. Scan all dependencies for known vulnerabilities
2. Update the security score
3. Provide recommendations for fixing security issues

### Automatic Detection of New Dependencies

The system automatically detects new dependencies added to your project's package.json and adds them to the security center. This ensures that all dependencies are monitored for security vulnerabilities.

## Best Practices

1. **Regular Audits**: Run security audits regularly to check for new vulnerabilities
2. **Keep Dependencies Updated**: Update dependencies regularly, especially those with security vulnerabilities
3. **Use Security-Only Updates**: For production environments, consider using the "Security Only" update mode
4. **Review Changes**: Always review changes before applying updates to ensure compatibility

## Implementation Details

The security center uses the following data sources:

1. **npm audit**: For vulnerability information
2. **package.json**: For dependency information
3. **npm registry**: For latest version information

Vulnerability severity levels:
- **Critical**: Requires immediate attention
- **High**: Should be addressed as soon as possible
- **Medium**: Should be addressed in the next update cycle
- **Low**: Should be addressed when convenient

## Troubleshooting

If you encounter issues with the security center:

1. **Dependency Tab Not Loading**: Try refreshing the page or check your network connection
2. **WebSocket Errors**: These are typically related to browser extensions or network issues and don't affect the functionality of the security center
3. **Update Settings Not Responding**: Try resetting all settings using the "Reset All Settings" button
