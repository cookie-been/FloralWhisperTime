# Security Hardening Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add application-layer security hardening across the Express backend and admin web frontend, including expiring admin tokens, rate limiting, brute-force protection, input hardening, security headers, and duplicate-submission protection.

**Architecture:** Keep the current single-file Express backend and existing frontend API service layer, but add centralized security helpers in-place. The backend will own token verification, graded rate limiting, and request validation, while the frontend will centralize in-flight write suppression for all admin mutations.

**Tech Stack:** Express 5, Node.js crypto, multer, React 19, Ant Design 6, TypeScript, existing fetch-based API service

---

### Task 1: Harden backend token handling and security middleware

**Files:**
- Modify: `flower-shop-backend/server.js`

- [ ] **Step 1: Add security constants and helper state**

In `flower-shop-backend/server.js`, add:

- token lifetime constant for 8 hours
- in-memory maps for rate limits and login failures
- helper functions for:
  - current unix time
  - client IP extraction
  - structured security logging
  - fixed-window rate limit evaluation

- [ ] **Step 2: Replace static token format with signed expiring payload**

Update token generation and verification so tokens contain:

- `username`
- `iat`
- `exp`
- `nonce`

Keep HMAC-SHA256 signing with `ADMIN_AUTH_SECRET`.

Verification must reject malformed, tampered, wrong-user, and expired tokens.

- [ ] **Step 3: Add global security response headers**

Add middleware in `server.js` before route handlers to set:

- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`
- `Referrer-Policy: strict-origin-when-cross-origin`
- `Cross-Origin-Resource-Policy: same-site`

- [ ] **Step 4: Add generalized rate-limit middleware factory**

Implement a middleware helper that accepts:

- limit window
- max requests
- key resolver
- rejection message

Use this helper for later route attachment rather than scattering duplicated logic.

- [ ] **Step 5: Add login failure lockout helpers**

Implement separate login failure tracking by `IP + username` with:

- failure counter
- lockout expiration
- reset on successful login

### Task 2: Apply backend route protections and input hardening

**Files:**
- Modify: `flower-shop-backend/server.js`

- [ ] **Step 1: Tighten JSON parsing and URL validation helpers**

Add helpers for:

- bounded string normalization
- numeric bounds enforcement
- optional URL validation for image-like fields

Reuse them in flower, site config, and contact normalization.

- [ ] **Step 2: Attach route-specific rate limits**

Apply graded rate limiting to:

- `POST /api/admin/login`
- `POST /api/uploads`
- `POST /api/flowers`
- `PUT /api/flowers/:id`
- `DELETE /api/flowers/:id`
- `PUT /api/site-config`
- `POST /api/contact`
- public read endpoints

- [ ] **Step 3: Protect admin login against brute force**

Update `POST /api/admin/login` so it:

- checks lockout state before credential validation
- records failures on wrong credentials
- resets failures on success
- logs success, failure, and lockout events

- [ ] **Step 4: Harden write payload normalization**

Update flower and site-config normalization to enforce:

- max lengths for IDs, titles, descriptions, tags, and text fields
- numeric bounds for `price`, `sort`, `latitude`, `longitude`
- validated hero image and uploaded image URLs

- [ ] **Step 5: Harden contact submission**

Update `/api/contact` validation with:

- required trimmed fields
- max lengths for `name`, `phone`, and `message`
- explicit message for invalid payloads

- [ ] **Step 6: Improve security event logging**

Log:

- invalid token attempts
- rate-limit rejections
- login success/failure/lockout
- rejected upload attempts

### Task 3: Add frontend write-guard helpers

**Files:**
- Modify: `flower-shop-web/src/services/api.ts`

- [ ] **Step 1: Add request de-duplication helper for admin writes**

Create a small in-memory map keyed by action name so overlapping writes can be rejected locally while one is in flight.

- [ ] **Step 2: Wrap high-risk admin writes through the guard**

Apply the guard to:

- `loginAdmin`
- `createFlower`
- `updateFlower`
- `deleteFlower`
- `uploadFlowerImage`
- `updateSiteConfig`

- [ ] **Step 3: Normalize expired-token handling**

If backend returns token-expired style `401`, preserve the existing error surfacing pattern while keeping the response messages explicit.

### Task 4: Update admin pages to respect stronger duplicate-submission rules

**Files:**
- Modify: `flower-shop-web/src/pages/AdminLogin/AdminLogin.tsx`
- Modify: `flower-shop-web/src/pages/AdminFlowers/AdminFlowers.tsx`
- Modify: `flower-shop-web/src/pages/AdminSettings/AdminSettings.tsx`

- [ ] **Step 1: Harden login flow**

Ensure login submit short-circuits when already loading and surfaces backend lockout/rate-limit messages clearly.

- [ ] **Step 2: Harden flower save and delete flows**

Ensure flower save and delete actions cannot overlap from repeated clicks, including drawer actions and row actions.

- [ ] **Step 3: Harden upload flows**

Ensure flower image upload and hero image upload cannot be triggered repeatedly while already uploading.

- [ ] **Step 4: Harden settings save flow**

Ensure site settings save short-circuits repeated clicks and reflects request-in-flight state accurately.

### Task 5: Verify security behavior

**Files:**
- Modify: `flower-shop-backend/server.js` (if small fixes arise during verification)
- Modify: `flower-shop-web/src/services/api.ts` (if small fixes arise during verification)

- [ ] **Step 1: Run frontend build verification**

Run: `bash -lc 'PATH="$HOME/.local/node-v22.12.0-linux-x64/bin:$PATH" npm run build'`

Expected: `tsc -b && vite build` succeeds.

- [ ] **Step 2: Smoke-test backend login**

Run:

```bash
curl -s -X POST http://localhost:3001/api/admin/login \
  -H 'Content-Type: application/json' \
  -d '{"username":"admin","password":"Floral@2026"}'
```

Expected: JSON token response.

- [ ] **Step 3: Verify invalid login rejection**

Run the same command with a wrong password.

Expected: `401` with JSON message.

- [ ] **Step 4: Verify repeated invalid login lockout**

Run repeated invalid login attempts from the same client.

Expected: eventual lockout or `429` behavior with a clear message.

- [ ] **Step 5: Verify expired-token rejection path**

Generate or simulate an expired token through local logic and call an admin endpoint.

Expected: `401` with token-expired style message.

- [ ] **Step 6: Verify frontend dev flows manually**

Check in the browser:

- repeated login click does not submit multiple times
- repeated flower save click does not create overlapping requests
- repeated upload click does not trigger overlapping uploads
- repeated settings save click is suppressed while in flight
