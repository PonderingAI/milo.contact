# Configuring Clerk for Vercel Environments

This document outlines the recommended approach for configuring Clerk authentication to work seamlessly across different Vercel environments: Production, Preview, and Development.

## The Issue

When using Clerk for authentication, especially for protected sections like `/admin`, you might encounter authentication errors on Vercel preview deployments. This often happens because the Clerk instance configured for your production environment has strict settings that don't recognize Vercel's dynamic preview URLs (e.g., `your-project-git-fork-your-account.vercel.app`) or might restrict logins to specific email domains.

If your production Clerk instance is configured to only allow your main production domain and specific email patterns (e.g., `yourcompany.com`), attempts to log in from a Vercel preview URL or with a different test email will fail.

## Recommended Solution: Separate Clerk Instances

The most robust and secure way to handle this is to use two separate Clerk instances:

1.  **Production Instance:** This instance will be used for your live production website. It should have:
    *   The production website URL configured as an allowed origin.
    *   Any email domain restrictions or specific sign-up rules required for production users.
    *   Production API keys.

2.  **Development/Preview Instance:** This instance will be used for local development and Vercel preview branches. It should have more relaxed settings:
    *   Allowed origins should include:
        *   `http://localhost:3000` (or your local development port).
        *   Vercel preview URL patterns. While Vercel URLs are dynamic, Clerk might support wildcard placeholders like `*.vercel.app` or you may need to add specific preview URLs if they are predictable. Refer to Clerk's documentation for the best way to handle dynamic preview URLs in allowed origins. If direct wildcard support for `*.vercel.app` isn't available or not recommended for your security posture, you might need a process to add currently active preview branch URLs.
    *   Email domain restrictions should be loosened or removed to allow for test accounts with various email addresses.
    *   Development API keys.

## Configuring Vercel Environment Variables

Vercel allows you to set environment variables for different environments (Production, Preview, Development). You'll use this feature to provide the correct Clerk keys to your Next.js application.

1.  **Obtain API Keys:**
    *   From your Clerk Dashboard, get the Publishable Key and Secret Key for your **Production instance**.
    *   Create a new Clerk instance for "Development" (or similar name) in your Clerk Dashboard. Get the Publishable Key and Secret Key for this **Development instance**.

2.  **Set Environment Variables in Vercel:**
    *   Go to your project's settings in Vercel.
    *   Navigate to "Environment Variables".
    *   **For the Production Environment (typically your main branch, e.g., `main`, `master`):**
        *   `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`: Set this to your **Production** Instance Publishable Key.
        *   `CLERK_SECRET_KEY`: Set this to your **Production** Instance Secret Key.
    *   **For Preview Environments (all non-production branches):**
        *   `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`: Set this to your **Development** Instance Publishable Key.
        *   `CLERK_SECRET_KEY`: Set this to your **Development** Instance Secret Key.
    *   **(Optional) For the Development Environment (local, using `vercel env pull`):**
        If you use `vercel env pull` to sync environment variables locally, Vercel's development environment settings will be used. Configure these similarly to the Preview environment, pointing to your **Development** Clerk instance.

## How It Works

Clerk's Next.js SDK (`@clerk/nextjs`) automatically uses the `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` and `CLERK_SECRET_KEY` environment variables that are present in the environment where your Next.js application is built and run. By setting these differently in Vercel for production and preview environments, your application will seamlessly switch to the appropriate Clerk instance without any code changes required in your Next.js app's Clerk initialization (`clerkMiddleware`, `<ClerkProvider>`, etc.).

## Verifying the Setup

After configuring the environment variables:

1.  Deploy a new preview branch on Vercel.
2.  Attempt to log in to the `/admin` section on this preview deployment.
3.  You should now be interacting with your Development Clerk instance, which should allow the preview URL and any test email accounts you've configured or allowed.

This setup ensures that your production authentication remains secure and isolated, while development and testing on preview branches can proceed without auth issues.
