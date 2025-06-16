# Authentication & RLS Fix Guide  
_milo.contact_

This document walks you through everything that changed to resolve the “Error updating BTS media” (HTTP 500) problem and introduces a **unified role system** for Clerk ⇄ Supabase.  
Follow it sequentially – by the end you will be able to:

* save BTS images without RLS violations  
* propagate **superAdmin → admin** automatically  
* restrict `/admin/**` pages to real admins

---

## 1  Root Causes

| # | Issue | Effect |
|---|-------|--------|
| 1 | RLS policies on several tables (`bts_images`, `media`, `projects` …) contained **`USING` without `WITH CHECK`**. | `INSERT` / `UPDATE` failed with `42501 row-level security violation`. |
| 2 | API routes used `createRouteHandlerClient({ cookies })` but **no Supabase session was present** because Clerk JWTs were not recognised. | `auth.uid()` evaluated to `null` inside RLS, so every row check failed. |
| 3 | Role strategy was fragmented – some checks looked at `user.publicMetadata.roles`, others at `public.user_roles`, none bridged Clerk ↔ Supabase. | Hard to reason about, easy to get out of sync. |

---

## 2  Solution Overview

### 2.1 Database layer

* Added **`WITH CHECK`** clauses to every “admins_manage_*” policy.  
* Provided automatic migration script `docs/migrations/fix-rls-policies.sql`.

### 2.2 Auth bridge (`lib/auth-sync.ts`)

* Ensures **Clerk user → Supabase user** exists (uses identical UUID).  
* If `publicMetadata.superAdmin === true` or `roles` contains `admin`, inserts a corresponding row in `public.user_roles`.  
* Exposes helpers:

```ts
getRouteHandlerSupabaseClient() // authenticated client for API routes
ensureUserHasRole(userId,'admin')
requireAdmin(req) // for API middleware
```

### 2.3 API routes

* `app/api/projects/bts-images/route.ts` and key admin routes now:
  * call `getRouteHandlerSupabaseClient()`  
  * validate admin role via Clerk metadata (`superAdmin` flag or `admin` role)
  * return consistent JSON errors.

### 2.4 Front-end guards

* `components/admin/admin-check.tsx` verifies admin via Clerk metadata:  
  `superAdmin` flag • Clerk `roles` array containing 'admin'.  
* Non-admins are redirected to `/admin/permission-denied`.

### 2.5 Webhooks

* `app/api/webhook/route.ts` (Clerk) listens to `user.created`, `user.updated`, `session.created` and calls `syncUserRoles()`.

---

## 3  Deployment Steps

1. **Pull latest code**  
   ```bash
   git checkout main
   git pull
   ```
2. **Apply SQL migration**  
   *Open Supabase → SQL Editor → execute* `docs/migrations/fix-rls-policies.sql`.  
   This creates/updates tables, extensions and policies.
3. **Environment variables** (see §7) – update `.env.local` and Vercel dashboard.
4. **Deploy** (Vercel / GitHub Actions).  
   All new API routes and middleware are serverless-ready.
5. **Add Clerk JWT template** (§4).  
6. **Add Clerk webhook** (§5).  
7. **Re-login** with a superAdmin account – role propagation will happen on the first sign-in.

---

## 4  Configuring the Clerk → Supabase JWT

1. Clerk Dashboard → **JWT Templates** → **Add**.  
2. Select **Supabase preset**.  
3. Paste your Supabase JWT secret (`SUPABASE_JWT_SECRET`) into “Signing key”.  
4. Template name: `supabase`.  
5. Algorithm: `HS256`.  
6. “Create & set as default”.  
7. Logout / login to refresh cookies (`sb` cookie will appear).

---

## 5  Setting up Clerk Webhooks

1. Clerk Dashboard → **Webhooks** → **Add endpoint**.  
2. URL:  
   ```
   https://<your-domain>/api/webhook
   ```
3. **Secret**: generate & copy → set as `CLERK_WEBHOOK_SECRET` env var.  
4. **Events**:  
   * `user.created`  
   * `user.updated`  
   * `session.created` (optional but recommended)  
5. Save.  
   Each event triggers role sync and Supabase user creation if needed.

---

## 6  Verifying the Fix

| Check | Expected result |
|-------|-----------------|
| `GET /api/test-auth` | JSON shows `supabaseUser.id` equals Clerk `user.id`. |
| Save BTS images in Admin UI | No console error, rows appear in `public.bts_images`. |
| Supabase query `SELECT * FROM user_roles;` | SuperAdmin row with `role='admin'`. |
| Non-admin user visits `/admin` | Redirected to `/admin/permission-denied`. |
| Insert via RPC/PG | Policies show both `USING` **and** `WITH CHECK`. |

---

## 7  Required Environment Variables

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | (optional) Admin key if you keep server-side bypasses |
| `SUPABASE_JWT_SECRET` | Same secret supplied to Clerk JWT template |
| `CLERK_WEBHOOK_SECRET` | Secret used to verify webhook signatures |
| `CLERK_PUBLISHABLE_KEY` / `CLERK_SECRET_KEY` | Standard Clerk keys |

---

## 8  Testing Procedures

### 8.1 Automated

* **Unit**: run `npm run test` – tests added for `auth-sync.ts`.  
* **Integration**: `jest` suites call the BTS route with mocked cookies and expect 200.

### 8.2 Manual Smoke Tests

1. **SuperAdmin workflow**  
   * Login as superAdmin → visit `/admin` → should load.  
   * Upload BTS images → rows inserted.

2. **Non-admin workflow**  
   * Create regular Clerk user → ensure no `roles` metadata.  
   * Login and attempt `/admin` → redirected.

3. **Role grant**  
   * From superAdmin account call `POST /api/admin/toggle-role` with `{ userId, role:'admin', action:'add' }`.  
   * Re-login as the user → access `/admin` succeeds.

4. **JWT validation**  
   Inspect browser cookies: you should see `sb` token (Supabase session).

---

### Troubleshooting Tips

* **Still getting `auth.uid() is null`?**  
  – Check JWT template is **default** and HS256 secret matches Supabase.  
* **RLS violation after migration?**  
  – Ensure `WITH CHECK` is present:  
  ```sql
  SELECT policyname, with_check FROM pg_policies WHERE tablename='bts_images';
  ```
* **Webhook 401**: confirm `CLERK_WEBHOOK_SECRET` identical in env and Clerk.

---

_Enjoy a coherent, secure authentication flow!_  
If anything is unclear open an issue or ping in Discord.
