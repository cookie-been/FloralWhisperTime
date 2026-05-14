# Gallery Catalog Expansion Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Expand the floral catalog to 72 total works, with 12 themed works per real category and locally served, style-consistent imagery.

**Architecture:** Generate a deterministic catalog dataset in the workspace, create a local image library under the web app's public assets, then batch write the catalog into the running Java backend using the existing admin and flower APIs. Verification relies on API checks, frontend build, and Docker redeploy because this repo has no frontend test suite and no practical automated image assertions in place.

**Tech Stack:** Spring Boot API, React/Vite web app, Docker Compose runtime, local scripts, JSON payload generation

---

### Task 1: Prepare deterministic catalog source data

**Files:**
- Create: `scripts/catalog/generate_catalog_dataset.mjs`
- Create: `tmp/catalog/catalog-dataset.json`
- Modify: `package.json` (only if a root helper script is truly needed; otherwise skip)

- [ ] **Step 1: Inspect the existing flower payload shape**

Read:
- `shared/types.ts`
- `flower-shop-web/src/services/api.ts`
- `flower-shop-backend-java/src/main/java/com/floralwhisper/dto/FlowerRequest.java`

Expected outcome:
- Confirm required keys: `id`, `name`, `categoryId`, `images`, `price`, `description`, `materials`, `meaning`, `tags`, `featured`, `sort`, `createdAt`

- [ ] **Step 2: Write a deterministic dataset generator**

Create `scripts/catalog/generate_catalog_dataset.mjs` to:
- define the 6 real categories
- define 12 works per category
- assign per-category naming pools, materials, tags, and price bands
- generate stable IDs like `wedding_003`, `daily_011`, `custom_012`
- assign featured status to 4 works per category
- assign sort values descending within the target ranges
- distribute `createdAt` over `2026-01` to `2026-05`
- output a JSON array of 72 works

The script should write to:
- `tmp/catalog/catalog-dataset.json`

- [ ] **Step 3: Run the generator and verify row count**

Run:
```bash
node scripts/catalog/generate_catalog_dataset.mjs
jq 'length' tmp/catalog/catalog-dataset.json
```

Expected:
- script exits `0`
- `jq` returns `72`

- [ ] **Step 4: Spot-check category distribution**

Run:
```bash
jq 'group_by(.categoryId) | map({category: .[0].categoryId, count: length})' tmp/catalog/catalog-dataset.json
```

Expected:
- 6 category entries
- each `count` is `12`

- [ ] **Step 5: Commit**

```bash
git add scripts/catalog/generate_catalog_dataset.mjs tmp/catalog/catalog-dataset.json
git commit -m "feat: add catalog dataset generator"
```

### Task 2: Build a locally served floral image library

**Files:**
- Create: `scripts/catalog/fetch_catalog_images.mjs`
- Create: `flower-shop-web/public/catalog/<category>/...`
- Create: `tmp/catalog/catalog-images-manifest.json`

- [ ] **Step 1: Decide image storage convention**

Use workspace-served static assets, not external image URLs.

Final image URL convention:
- `/catalog/wedding/wedding-001-a.jpg`
- `/catalog/daily/daily-011-b.jpg`
- `/catalog/custom/custom-006-c.jpg`

Rationale:
- keeps gallery assets local to the deployed web app
- avoids broken third-party URLs
- avoids mutating backend upload storage for bulk seed-like content

- [ ] **Step 2: Write the image acquisition script**

Create `scripts/catalog/fetch_catalog_images.mjs` to:
- read `tmp/catalog/catalog-dataset.json`
- create `flower-shop-web/public/catalog/<category>/`
- acquire 2-3 images per work using a deterministic, reachable source
- save files with stable names under the category directory
- write `tmp/catalog/catalog-images-manifest.json` mapping each work ID to saved image paths

Implementation note:
- if a public photo source blocks scripted downloads, fall back to a deterministic image endpoint or a generated placeholder image flow that still matches the floral theme closely enough for current deployment
- the script must not depend on editing `.env`

- [ ] **Step 3: Run the image acquisition script**

Run:
```bash
node scripts/catalog/fetch_catalog_images.mjs
```

Expected:
- script exits `0`
- image files are created under `flower-shop-web/public/catalog/`

- [ ] **Step 4: Verify image counts**

Run:
```bash
find flower-shop-web/public/catalog -type f | wc -l
jq 'to_entries | length' tmp/catalog/catalog-images-manifest.json
```

Expected:
- total image files is at least `144`
- manifest covers `72` works

- [ ] **Step 5: Commit**

```bash
git add scripts/catalog/fetch_catalog_images.mjs flower-shop-web/public/catalog tmp/catalog/catalog-images-manifest.json
git commit -m "feat: add local floral catalog images"
```

### Task 3: Merge image paths into the final catalog payload

**Files:**
- Create: `scripts/catalog/build_catalog_payload.mjs`
- Create: `tmp/catalog/catalog-payload.json`

- [ ] **Step 1: Write the payload builder**

Create `scripts/catalog/build_catalog_payload.mjs` to:
- read `tmp/catalog/catalog-dataset.json`
- read `tmp/catalog/catalog-images-manifest.json`
- inject the saved public image paths into each work's `images` array
- emit `tmp/catalog/catalog-payload.json`

- [ ] **Step 2: Build the final payload**

Run:
```bash
node scripts/catalog/build_catalog_payload.mjs
```

Expected:
- script exits `0`
- `tmp/catalog/catalog-payload.json` exists

- [ ] **Step 3: Verify image arrays and featured counts**

Run:
```bash
jq 'map(select((.images | length) < 2)) | length' tmp/catalog/catalog-payload.json
jq 'group_by(.categoryId) | map({category: .[0].categoryId, featured: map(select(.featured == true)) | length})' tmp/catalog/catalog-payload.json
```

Expected:
- first command returns `0`
- second command shows `4` featured works for each category

- [ ] **Step 4: Commit**

```bash
git add scripts/catalog/build_catalog_payload.mjs tmp/catalog/catalog-payload.json
git commit -m "feat: build final catalog payload"
```

### Task 4: Batch write the catalog to the running backend

**Files:**
- Create: `scripts/catalog/push_catalog_to_api.mjs`
- Modify: `tmp/catalog/catalog-payload.json` only if data fixes are required

- [ ] **Step 1: Write the API push script**

Create `scripts/catalog/push_catalog_to_api.mjs` to:
- log in with existing admin credentials from the running service
- fetch existing flowers from `/api/flowers?limit=200`
- compare by `id`
- create missing works with `POST /api/flowers`
- update existing matching works with `PUT /api/flowers/{id}`
- log counts for created, updated, and failed rows

The script should target:
- `http://127.0.0.1:3001` when run from the Linux workspace

- [ ] **Step 2: Run the push script**

Run:
```bash
node scripts/catalog/push_catalog_to_api.mjs
```

Expected:
- script exits `0`
- output reports `72` total target records handled

- [ ] **Step 3: Verify backend counts by API**

Run:
```bash
curl -s 'http://127.0.0.1:3001/api/flowers?limit=200' | jq '.list | length'
curl -s 'http://127.0.0.1:3001/api/flowers?limit=200' | jq '.list | group_by(.categoryId) | map({category: .[0].categoryId, count: length})'
```

Expected:
- first command returns at least `72`
- second command shows `12` works for each real category

- [ ] **Step 4: Commit**

```bash
git add scripts/catalog/push_catalog_to_api.mjs
git commit -m "feat: add catalog sync script for running api"
```

### Task 5: Verify frontend behavior and deploy

**Files:**
- Verify: `flower-shop-web/public/catalog/**`
- Verify: running Docker services

- [ ] **Step 1: Rebuild the web app**

Run:
```bash
docker run --rm -v /workspace/FloralWhisperTime:/app -w /app/flower-shop-web node:22.12.0-alpine sh -lc 'npm ci && npm run build'
```

Expected:
- exit `0`
- Vite build completes successfully

- [ ] **Step 2: Redeploy web**

Run:
```bash
docker compose up -d --build web
```

Expected:
- web container starts successfully

- [ ] **Step 3: Verify public HTML and API remain healthy**

Run:
```bash
curl -I http://127.0.0.1:8081
curl -s http://127.0.0.1:3001/api/health
curl -s 'http://127.0.0.1:3001/api/flowers?categoryId=wedding&limit=20' | jq '.list | length'
curl -s 'http://127.0.0.1:3001/api/flowers?categoryId=preserved&limit=20' | jq '.list | length'
```

Expected:
- web returns `200 OK`
- health endpoint reports healthy
- wedding count is `12`
- preserved count is `12`

- [ ] **Step 4: Commit**

```bash
git add flower-shop-web/public/catalog
git commit -m "feat: publish expanded floral catalog assets"
```

