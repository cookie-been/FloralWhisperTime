# Security Hardening Design

## Context

The current project is optimized for product functionality, not for enterprise-style application security. The backend is a single-file Express service with JSON file persistence, while the web frontend performs direct write operations against that service. This creates four immediate security weaknesses:

1. Admin login has no brute-force protection.
2. Public and authenticated endpoints have no request rate controls.
3. Admin authentication tokens never expire.
4. Frontend write actions rely mostly on local loading states and do not consistently prevent duplicate submissions.

The goal of this effort is to establish a stronger application-layer security baseline that fits the current architecture without pretending this project already has infrastructure such as Redis, API gateways, or WAF enforcement.

## Goals

- Add enterprise-style application-layer protections that materially reduce abuse risk in the current deployment model.
- Introduce expiring admin tokens with an 8-hour lifetime.
- Add graded rate limiting across login, upload, write, public read, and contact submission routes.
- Add login failure tracking and temporary lockout behavior.
- Add consistent duplicate-submission protection in the web admin frontend.
- Add stricter request validation and security response headers.
- Add minimal security event logging for operational visibility.

## Non-Goals

- No Redis, distributed locks, or shared-memory rate limiting.
- No API gateway, CDN WAF, or upstream reverse-proxy rules in this implementation.
- No user account system beyond the existing single admin identity.
- No full audit database or long-term SIEM integration.
- No CAPTCHA or MFA in this implementation cycle.

## Security Positioning

This implementation is an enterprise-style **application baseline**, not a complete enterprise perimeter.

That means:

- request handling should be defensive and measurable
- abusive clients should be slowed, rejected, or temporarily blocked
- credentials and sessions should expire
- repeated frontend write actions should be suppressed

It does **not** mean:

- distributed abuse protection
- cross-node coordinated lockouts
- advanced bot detection

## Architecture Strategy

## 1. Token Hardening

Replace the current token format with a signed payload containing:

- `username`
- `iat` (issued at, unix seconds)
- `exp` (expiration time, unix seconds)
- `nonce` (random per token issuance)

### Token Lifetime

- Admin token lifetime: `8 hours`

### Verification Rules

Token validation must fail when:

- token is malformed
- signature does not match
- username does not match configured admin user
- `exp` is in the past

### Implementation Notes

- Continue using HMAC-SHA256 signing with `ADMIN_AUTH_SECRET`
- Keep transport format compact and self-contained
- Return `401` with the existing JSON error shape for invalid or expired tokens

## 2. Rate Limiting Model

Introduce in-memory, route-aware rate limiting using fixed windows or sliding windows per key.

### Keying Strategy

Rate limit keys should use:

- client IP for public traffic
- `IP + username` for login failure tracking
- client IP for upload and contact routes
- client IP or authenticated identity for admin write endpoints

If proxy headers are trusted in the future, this logic can evolve. In the current implementation, it should use Express request IP behavior consistently.

### Limit Tiers

#### Admin Login

Most restrictive tier.

Intended behavior:

- low request allowance per minute
- temporary lockout after repeated failed attempts
- successful login clears the failure counter for that `IP + username` key

#### Upload Route

Strict tier.

Intended behavior:

- tighter allowance than normal writes
- prevents rapid upload abuse

#### Admin Write Routes

Moderate tier.

Applies to:

- `POST /api/flowers`
- `PUT /api/flowers/:id`
- `DELETE /api/flowers/:id`
- `PUT /api/site-config`

#### Public Read Routes

Relaxed tier.

Applies to:

- flower listing and detail routes
- categories
- site config
- shop info
- brand story
- team

These limits should still exist to reduce naive scraping or burst abuse.

#### Contact Submission

Custom tier.

Should be stricter than public reads and should reject high-frequency repeated submissions.

### Limit Responses

When a limit is exceeded:

- return `429`
- preserve JSON error format: `{ message: "..." }`
- include a clear Chinese message indicating retry later

## 3. Login Failure Tracking and Temporary Lockout

Implement a login protection layer separate from the generic rate limiter.

### Behavior

- track failed login attempts by `IP + username`
- after threshold is reached, deny further attempts for a temporary lockout window
- successful login resets that failure state

### Rationale

This is distinct from generic request throttling because:

- it should survive within a longer abuse window than ordinary rate limits
- it should communicate “account access temporarily restricted” rather than only “too many requests”

## 4. Security Response Headers

Add baseline response headers globally.

Required headers:

- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`
- `Referrer-Policy: strict-origin-when-cross-origin`
- `Cross-Origin-Resource-Policy: same-site`

Optional headers may be added if they do not break the current app, but the implementation should stay conservative since the project currently serves uploaded images and a separate frontend.

## 5. Input Hardening

Strengthen validation for both public and admin-facing routes.

### General Rules

- reject unexpectedly large bodies earlier
- trim strings consistently
- enforce sane field lengths for names, titles, messages, tags, descriptions, and IDs
- validate numeric bounds for price, sort, latitude, longitude
- validate image and hero URLs before persisting them

### Upload Hardening

Keep image-only uploads, but add additional checks where possible:

- validate MIME starts with `image/`
- preserve file size cap
- reject empty upload payloads

### Contact Form Hardening

Validate:

- required fields present
- string length bounds
- message length reasonable for a simple contact use case

## 6. Frontend Duplicate Submission Protection

The admin frontend should treat every write flow as an idempotent user interaction, even if backend persistence is not formally idempotent.

### Required Surfaces

- admin login submit
- flower save
- flower delete
- site settings save
- image upload
- hero image upload

### Behavior

- disable or short-circuit repeated clicks while a request is active
- avoid dispatching multiple overlapping requests for the same action
- ensure visual loading state matches the lock

### Scope

This does not add API-level idempotency keys. It adds robust UI-level duplicate suppression appropriate to the current architecture.

## 7. Security Event Logging

Add minimal structured logging to backend security-critical events.

Events to log:

- login failure
- login lockout
- successful login
- rate-limit rejection
- invalid or expired token rejection
- rejected upload attempts

The log format can remain simple `console` output as long as it is structured enough to search and reason about operationally.

## 8. Failure Handling and User Messaging

Security rejections should remain human-readable.

Examples of situations that should produce explicit messages:

- too many login attempts
- token expired
- upload too frequent
- contact submissions too frequent
- write operations too frequent

Frontend should surface these messages through the existing Ant Design feedback pattern.

## Implementation Boundaries

## Backend

Primary implementation target:

- `flower-shop-backend/server.js`

The backend currently centralizes all routing in one file. This security pass should stay consistent with that structure instead of starting a framework-level refactor at the same time.

## Frontend

Primary implementation targets:

- `flower-shop-web/src/services/api.ts`
- admin pages with write actions

The frontend should centralize as much write-guard behavior as practical so pages do not each invent their own partial solution.

## Verification Strategy

Because this repo has no automated test framework, verification should be command- and behavior-based.

### Backend Verification

- successful admin login returns a token
- invalid password returns `401`
- repeated invalid login attempts eventually return `429` or lockout-style denial
- expired token returns `401`
- repeated upload attempts hit rate limiting
- repeated contact submissions hit rate limiting

### Frontend Verification

- repeated rapid clicks on login/save/upload/delete do not create overlapping submissions
- error messages still surface correctly

### Build Verification

- `npm run build` in `flower-shop-web`
- backend runtime smoke checks via `curl`

## Scope Summary

This implementation includes:

- expiring 8-hour admin tokens
- login lockout and route-aware rate limiting
- security response headers
- stricter input validation
- frontend duplicate-submission protection
- minimal security event logging

It does not include infrastructure-level DDoS defense. That remains an outer-layer responsibility for deployment architecture.
