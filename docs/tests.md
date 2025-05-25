# Admin Section Testing Procedures

This document outlines the procedures for testing the `/admin` section of this application, with a particular focus on testing in Vercel preview environments.

## Prerequisites

1.  **Clerk Configuration for Preview Environments:** Ensure that the Clerk authentication system is correctly configured for Vercel preview branches as per the instructions in `docs/vercel-clerk-setup.md`. This typically involves using a separate "Development" Clerk instance that allows logins from `*.vercel.app` domains and is configured with appropriate test user accounts or relaxed email policies.

2.  **Test User Accounts:**
    *   You will need test user accounts that can successfully authenticate through the Development Clerk instance.
    *   These accounts should ideally have the necessary roles/permissions (e.g., "admin") to access all functionalities within the `/admin` section.
    *   If specific test emails are required, ensure they are known and available.

## Accessing `/admin` on a Vercel Preview Branch

1.  Open a pull request or push a commit to a branch. Vercel will generate a preview deployment.
2.  Obtain the URL for the preview deployment (e.g., `your-project-git-fork-your-account.vercel.app`).
3.  Navigate to the `/admin` section of the preview deployment (e.g., `https://your-project-git-fork-your-account.vercel.app/admin`).
4.  You should be redirected to the Clerk sign-in page.
5.  Log in using one of the designated test user accounts.
6.  Upon successful authentication, you should be redirected to the `/admin` dashboard.

## Key Functionalities to Test in `/admin`

The following is a non-exhaustive list of key areas and functionalities to verify. Specific tests may vary based on current development tasks.

### 1. Authentication and Authorization
    - [ ] Verify successful login to `/admin` using a valid test admin user.
    - [ ] Verify that navigating to `/admin` without being logged in redirects to the sign-in page.
    - [ ] (If applicable) Verify that users without admin privileges cannot access `/admin`.
    - [ ] Verify successful logout redirects correctly (e.g., to the homepage or sign-in page).

### 2. Admin Dashboard
    - [ ] Verify the admin dashboard loads correctly after login.
    - [ ] Check that all expected widgets or information panels are displayed.
    - [ ] Test any interactive elements on the dashboard (e.g., links, buttons).

### 3. Project Management
    - [ ] **View Projects:**
        - [ ] Navigate to the projects list page.
        - [ ] Verify existing projects are listed correctly.
        - [ ] Test pagination if available.
        - [ ] Test any search or filtering functionality.
    - [ ] **Create New Project:**
        - [ ] Navigate to the "create new project" form.
        - [ ] Fill out all required fields with valid test data.
        - [ ] Test image/media uploads for the project if applicable.
        - [ ] Submit the form and verify the new project is created successfully and appears in the projects list.
    - [ ] **Edit Existing Project:**
        - [ ] Select an existing project to edit.
        - [ ] Modify various fields (e.g., title, description, media).
        - [ ] Save the changes and verify they are reflected correctly in the project details and list.
    - [ ] **Delete Project:**
        - [ ] Select a test project to delete.
        - [ ] Confirm the deletion.
        - [ ] Verify the project is removed from the projects list.

### 4. Media Management
    - [ ] **View Media Library:**
        - [ ] Navigate to the media library/management page.
        - [ ] Verify existing media items are displayed.
    - [ ] **Upload Media:**
        - [ ] Test uploading new images or other media types.
        - [ ] Verify successful upload and that the media appears in the library.
    - [ ] **Edit Media Details (if applicable):**
        - [ ] Test editing metadata for media items (e.g., alt text, captions).
    - [ ] **Delete Media:**
        - [ ] Select a test media item to delete.
        - [ ] Verify it's removed from the library and (importantly) check if it's correctly disassociated from any projects using it.

### 5. Settings
    - [ ] Navigate to the admin settings page.
    - [ ] **Site Information:**
        - [ ] Test modifying site settings (e.g., site title, contact info).
        - [ ] Verify changes are saved and potentially reflected on the public-facing site (if applicable, might require cache clearing or redeploy for some settings).
    - [ ] **User Management (if admin can manage other users):**
        - [ ] View list of users.
        - [ ] Test inviting new users or modifying roles of existing users (use with caution and only with test accounts).

### 6. Database / Debug / Security Sections
    - [ ] **Database Section:**
        - [ ] Verify that database status or management tools load correctly.
        - [ ] (Caution) Perform read-only checks or minor, reversible actions if comfortable and necessary for the test. Avoid actions that could compromise data integrity on shared preview environments.
    - [ ] **Security Section:**
        - [ ] Check that security information or audit logs are displayed.
    - [ ] **Debug Section:**
        - [ ] Explore debug tools to ensure they are operational.
        - [ ] Check for any reported errors or issues within the debug interface.

## Reporting Issues

*   If any issues are found, report them with clear steps to reproduce, including:
    *   The Vercel preview URL.
    *   The test user account used (if relevant).
    *   Expected behavior vs. actual behavior.
    *   Any console errors or relevant screenshots.

This testing guide should be updated as new features are added to the `/admin` section.
