# Java MySQL Backend Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Promote `flower-shop-backend-java` into the primary enterprise-style backend, keeping `/api/*` compatibility for existing clients while formalizing MySQL-based persistence, migration discipline, and migration tooling.

**Architecture:** Build on the existing Spring Boot modular monolith foundation. Keep the current business modules and API contract, but strengthen compatibility verification, persistence consistency, migration tooling, and operational readiness so the Java backend can replace the Node/JSON backend cleanly.

**Tech Stack:** Java 17, Spring Boot 3, Spring Web MVC, Spring Security, Spring Validation, MyBatis-Plus, MySQL 8, Flyway, JWT, Maven

---

### Task 1: Audit and align Java backend compatibility

**Files:**
- Modify: `flower-shop-backend-java/src/main/java/com/floralwhisper/controller/AdminController.java`
- Modify: `flower-shop-backend-java/src/main/java/com/floralwhisper/controller/FlowerController.java`
- Modify: `flower-shop-backend-java/src/main/java/com/floralwhisper/controller/SiteController.java`
- Modify: `flower-shop-backend-java/src/main/java/com/floralwhisper/common/GlobalExceptionHandler.java`
- Modify: `flower-shop-backend-java/src/main/java/com/floralwhisper/service/AuthService.java`
- Modify: `flower-shop-backend-java/src/main/java/com/floralwhisper/service/FlowerService.java`
- Modify: `flower-shop-backend-java/src/main/java/com/floralwhisper/service/SiteService.java`

- [ ] **Step 1: Compare Java endpoint behavior against current frontend expectations**

Review controller/service behavior and explicitly verify:

- path compatibility
- request body compatibility
- `{ "message": "..." }` error shape compatibility
- upload response shape compatibility
- array fields (`images`, `materials`, `tags`, `stats`) compatibility

Document any mismatches inline as code comments or immediate fixes, not as external TODOs.

- [ ] **Step 2: Align auth response semantics**

Ensure `/api/admin/login` and `/api/admin/me` match current frontend behavior exactly, including:

- token field names
- username response
- unauthorized error wording

- [ ] **Step 3: Align flower serialization details**

Verify and adjust flower list/detail/related responses so:

- sorting behavior matches current Node backend
- `createdAt` serialization is stable
- empty child collections serialize as arrays, not nulls

- [ ] **Step 4: Align site-content serialization details**

Verify and adjust site-config/shop-info/brand-story/team responses so:

- singleton records are always present
- `stats` ordering is stable
- story image arrays serialize consistently

### Task 2: Strengthen Java backend enterprise baseline

**Files:**
- Modify: `flower-shop-backend-java/src/main/java/com/floralwhisper/config/AppProperties.java`
- Modify: `flower-shop-backend-java/src/main/java/com/floralwhisper/config/SecurityConfig.java`
- Modify: `flower-shop-backend-java/src/main/java/com/floralwhisper/security/JwtService.java`
- Modify: `flower-shop-backend-java/src/main/java/com/floralwhisper/security/JwtAuthenticationFilter.java`
- Modify: `flower-shop-backend-java/src/main/resources/application.yml`

- [ ] **Step 1: Externalize and normalize security-related configuration**

Review `AppProperties` and `application.yml` so the Java backend cleanly supports:

- DB config
- admin creds
- JWT secret
- token expiration
- upload directory
- public base URL

Use enterprise-style naming and safe defaults for local development only.

- [ ] **Step 2: Verify JWT lifetime and validation policy**

Ensure JWT creation and validation support:

- explicit expiration
- issuer/subject clarity if already modeled
- proper rejection on expiry or malformed token

- [ ] **Step 3: Add or refine security response headers and CORS policy**

If not already present, add backend-level hardening appropriate to the Java service:

- basic response headers
- explicit CORS policy suitable for Web + mini-program consumption

Keep compatibility with current frontend environments.

- [ ] **Step 4: Ensure request validation is applied consistently**

Review DTOs and controllers so validation annotations and rejection behavior are consistent for:

- login
- flower create/update
- site-config update
- contact submission

### Task 3: Formalize MySQL schema and migration readiness

**Files:**
- Modify: `flower-shop-backend-java/src/main/resources/db/migration/V1__create_schema.sql`
- Modify: `flower-shop-backend-java/src/main/resources/db/migration/V2__seed_initial_data.sql`
- Create: `flower-shop-backend-java/src/main/resources/db/migration/V3__add_enterprise_indexes_and_constraints.sql`

- [ ] **Step 1: Review existing schema against approved architecture**

Check current Flyway schema coverage against the approved tables:

- flowers
- flower_images
- flower_materials
- flower_tags
- categories
- site_config
- site_config_stats
- shop_info
- brand_story
- brand_story_images
- team_members
- contacts

- [ ] **Step 2: Add missing indexes and constraints**

Create a new migration that adds:

- relevant indexes for public query paths
- uniqueness constraints where appropriate
- foreign keys where appropriate and safe for this domain

Keep the migration incremental rather than rewriting V1/V2 destructively.

- [ ] **Step 3: Verify seed data preserves API compatibility**

Review seeded singleton and reference data so Java backend can boot into a frontend-compatible state without manual DB intervention.

### Task 4: Build JSON-to-MySQL migration tooling

**Files:**
- Create: `flower-shop-backend-java/src/main/java/com/floralwhisper/migration/JsonImportRunner.java`
- Create: `flower-shop-backend-java/src/main/java/com/floralwhisper/migration/JsonImportService.java`
- Create: `flower-shop-backend-java/src/main/java/com/floralwhisper/migration/JsonImportModels.java`
- Modify: `flower-shop-backend-java/src/main/resources/application.yml`
- Test/Verify against: `flower-shop-backend/data/db.json`

- [ ] **Step 1: Add a migration import entrypoint**

Create a controlled import mode that:

- reads the legacy JSON file
- maps it to normalized relational writes
- can be run intentionally rather than on every boot

- [ ] **Step 2: Implement import mapping for catalog data**

Import:

- flowers
- child image rows
- child material rows
- child tag rows
- categories

Preserve existing business IDs.

- [ ] **Step 3: Implement import mapping for site-content data**

Import:

- site config
- stats
- shop info
- brand story
- brand story images
- team members

- [ ] **Step 4: Implement import mapping for contacts**

If contact records exist in the legacy JSON, import them into `contacts`.

- [ ] **Step 5: Add import safety guards**

The import tool should:

- fail clearly on malformed JSON
- avoid accidental duplicate re-import behavior where possible
- log counts for each imported aggregate type

### Task 5: Add verification and regression coverage for Java backend

**Files:**
- Create: `flower-shop-backend-java/src/test/java/com/floralwhisper/controller/AdminControllerTest.java`
- Create: `flower-shop-backend-java/src/test/java/com/floralwhisper/controller/FlowerControllerTest.java`
- Create: `flower-shop-backend-java/src/test/java/com/floralwhisper/controller/SiteControllerTest.java`
- Create: `flower-shop-backend-java/src/test/java/com/floralwhisper/migration/JsonImportServiceTest.java`

- [ ] **Step 1: Add controller-level compatibility tests**

Cover:

- admin login success/failure
- flower list/detail responses
- site-config retrieval
- error shape compatibility

- [ ] **Step 2: Add migration import tests**

Verify JSON import produces:

- expected flower counts
- expected child row counts
- expected singleton site-content rows

- [ ] **Step 3: Add targeted regression checks for array-style fields**

Ensure Java responses continue to emit:

- `images`
- `materials`
- `tags`
- `stats`

as arrays with stable ordering.

### Task 6: Validate cutover readiness

**Files:**
- Modify if needed: `flower-shop-backend-java/README.md`
- Modify if needed: `flower-shop-backend-java/AGENTS.md`
- Create: `docs/superpowers/migration-checklists/2026-05-13-java-cutover-checklist.md`

- [ ] **Step 1: Run Java test suite**

Run: `cd flower-shop-backend-java && mvn test`

Expected: tests pass.

- [ ] **Step 2: Run package verification**

Run: `cd flower-shop-backend-java && mvn package`

Expected: application packages successfully.

- [ ] **Step 3: Run Java backend locally against MySQL**

Start the Java backend with local MySQL credentials and confirm:

- `GET /api/health`
- `POST /api/admin/login`
- `GET /api/flowers`
- `GET /api/site-config`

all behave as expected.

- [ ] **Step 4: Create a cutover checklist**

Write a concise checklist covering:

- DB ready
- Flyway run
- JSON import run
- API smoke checks
- frontend env switch
- rollback path to Node backend

- [ ] **Step 5: Update docs for primary-backend usage**

Revise Java backend docs so future work treats it as the operational mainline, not an experimental alternative.
