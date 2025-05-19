# Deployment Guide

## Handling Build Script Warnings

If you see the following warning in your Vercel build logs:

\`\`\`
╭ Warning 
│                                                                              │
│   Ignored build scripts: @clerk/shared.                                      │
│   Run "pnpm approve-builds" to pick which dependencies should be allowed     │
│   to run scripts.
\`\`\`

This is a security feature in pnpm that prevents potentially malicious scripts from running during installation. To fix this, you can:

### Option 1: Run the approve-builds script locally

\`\`\`bash
pnpm approve-builds
\`\`\`

This will update your `.npmrc` file to allow scripts from @clerk/shared.

### Option 2: Add a build command in Vercel

Add the following to your build command in Vercel:

\`\`\`bash
pnpm allow-scripts @clerk/shared && next build
\`\`\`

### Option 3: Use the provided .npmrc file

We've included a `.npmrc` file in the repository that already approves the necessary scripts. Make sure this file is committed and deployed to Vercel.

## Other Deployment Notes

- Make sure all environment variables are properly set in your Vercel project settings
- The build process may take a few minutes due to the size of the dependencies
- If you encounter other build issues, check the Vercel build logs for more details
\`\`\`

Let's also update the CODE_OVERVIEW.md file to mention this:
