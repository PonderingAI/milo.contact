# Milo Presedo Portfolio - Development Culture

This document outlines the key principles specific to this project, which serves both as a personal portfolio and a reusable website builder for future clients.

## Core Principles

- **Dual-Purpose Architecture**: Remember that this codebase serves as both a portfolio site and a reusable website builder. Design components and systems to be easily customizable for future clients.

- **No Mock Data in Admin**: Always use real data in admin interfaces. Mock data creates a false sense of functionality and can hide real issues.

- **Lightweight Public Pages**: Keep public-facing pages as lightweight as possible:
  - No database setup checks on non-admin pages
  - Minimize JavaScript on public pages
  - Optimize for first contentful paint on portfolio pages

- **Admin/Public Separation**: Maintain a clear separation between admin functionality and public-facing content. Admin features should never impact public page performance.

- **Progressive Enhancement**: Build the public portfolio to work without JavaScript first, then enhance with interactive features.

- **Database Checks in Admin Only**: All database setup checks, table existence verification, and similar operations should ONLY run in the /admin section of the site.

- **Reusable Components**: Design components to be reusable across different client projects with minimal modification.

- **Client-Specific Theming**: Keep design tokens and theme variables separate from component logic to enable easy restyling for different clients.

- **Documentation for Reuse**: Document components and APIs with future reuse in mind. Include examples of how to customize for different client needs.

- **Performance Budgets**: Establish and maintain performance budgets for public-facing pages. Monitor these regularly.

- **Minimal Dependencies**: Be conservative with adding new dependencies. Each one increases maintenance burden and potential security issues.

- **Feature Toggles**: Use feature toggles to enable/disable functionality for different client deployments.

- **Environment-Based Configuration**: Use environment variables to configure site behavior for different deployments.

- **Incremental Adoption**: Design systems to allow for incremental adoption in client projects. Not all clients will need all features.

- **Minimize User Clicks**: Design admin interfaces to require the fewest clicks possible to accomplish tasks:
  - Automate routine operations where possible
  - Start necessary processes automatically without user intervention
  - Only show options that are relevant to the current context

- **Progressive Disclosure**: Hide complexity from novice users:
  - Show basic options by default
  - Place advanced features in intuitive sub-menus
  - Automate technical setup steps where possible

- **Contextual UI**: Only show UI elements that are relevant to the current state:
  - Don't show buttons for actions that can't be performed
  - Automatically trigger necessary setup processes
  - Adapt the interface based on the user's permissions and the system state

Remember that every line of code in public pages has a performance cost. Be intentional about what runs where.

\`\`\`

Now, let's update the dependency scanner component to support automatic scanning:
