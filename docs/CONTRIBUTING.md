# Contributing to Milo Website Builder

Thank you for considering contributing to this project! This document outlines the guidelines and workflows for contributing to the Milo website builder framework.

## Development Workflow

### Setting Up Development Environment

1. Fork the repository
2. Clone your fork: `git clone https://github.com/yourusername/milo-website-builder.git`
3. Install dependencies: `npm install`
4. Create a `.env.local` file with the required environment variables (see `.env.example`)
5. Run the development server: `npm run dev`

### Branch Naming Convention

- `feature/your-feature-name` - For new features
- `fix/issue-description` - For bug fixes
- `refactor/component-name` - For code refactoring
- `docs/what-you-documented` - For documentation updates

### Commit Message Guidelines

Follow the [Conventional Commits](https://www.conventionalcommits.org/) specification:

- `feat:` - A new feature
- `fix:` - A bug fix
- `docs:` - Documentation changes
- `style:` - Changes that don't affect code functionality (formatting, etc.)
- `refactor:` - Code changes that neither fix a bug nor add a feature
- `perf:` - Performance improvements
- `test:` - Adding or correcting tests
- `chore:` - Changes to the build process, tools, etc.

### Pull Request Process

1. Update your fork to the latest upstream version
2. Create a new branch from `main`
3. Make your changes
4. Test thoroughly
5. Push your branch to your fork
6. Create a pull request to the `main` branch of the original repository
7. Describe your changes in detail in the PR description

## Code Style Guidelines

### TypeScript

- Use TypeScript for all new code
- Add proper type definitions
- Avoid using `any` type when possible
- Use interfaces for object shapes

### React Components

- Use functional components with hooks
- Add proper prop types
- Use destructuring for props
- Keep components focused on a single responsibility

### CSS/Styling

- Use Tailwind CSS classes
- Follow mobile-first approach
- Use CSS variables for theming

## Testing

- Write tests for critical functionality
- Run existing tests before submitting a PR
- Add new tests for new features

## Documentation

- Update documentation when adding new features
- Document complex functions and components
- Keep documentation up to date with code changes
- [Code Overview](./CODE_OVERVIEW.md)

## Environment Variables

- Never commit actual environment variable values to the repository
- Use the `.env.example` file as a template for required variables
- Refer to the README for details on configuration
- Keep all sensitive information secure

## Questions?

If you have any questions about contributing, please open an issue or contact the maintainers.

Thank you for your contributions!
\`\`\`

Now, let's move CHANGELOG.md to docs:
