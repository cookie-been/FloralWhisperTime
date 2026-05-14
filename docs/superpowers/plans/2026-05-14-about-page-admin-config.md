# About Page Admin Config Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the public About page fully admin-configurable, including hero content, story content, timeline entries, and team members.

**Architecture:** Add a dedicated About page singleton config plus timeline list management on the backend, expose authenticated admin endpoints, add a dedicated `/admin/about` page on the web admin, and switch the public About page to read only backend-managed content. Reuse the existing upload endpoint for team avatars and reuse current admin visual patterns for list maintenance and drawer editing.

**Tech Stack:** Spring Boot + MyBatis-Plus backend, React 19 + Vite + Ant Design 6 web admin, existing Docker deployment flow

---

## File Structure

### Backend

- Create: `flower-shop-backend-java/src/main/resources/db/migration/V5__add_about_page_and_timeline.sql`
  - Adds singleton about page config table and timeline table
- Create: `flower-shop-backend-java/src/main/java/com/floralwhisper/entity/AboutPage.java`
  - Singleton about page config entity
- Create: `flower-shop-backend-java/src/main/java/com/floralwhisper/entity/AboutTimelineEntry.java`
  - Sortable timeline entry entity
- Create: `flower-shop-backend-java/src/main/java/com/floralwhisper/mapper/AboutPageMapper.java`
  - MyBatis mapper for singleton about page config
- Create: `flower-shop-backend-java/src/main/java/com/floralwhisper/mapper/AboutTimelineEntryMapper.java`
  - MyBatis mapper for timeline entries
- Create: `flower-shop-backend-java/src/main/java/com/floralwhisper/dto/AboutPageResponse.java`
  - Public/admin response for about page config
- Create: `flower-shop-backend-java/src/main/java/com/floralwhisper/dto/AboutPageUpdateRequest.java`
  - Admin update request for about page config
- Create: `flower-shop-backend-java/src/main/java/com/floralwhisper/dto/AboutTimelineEntryResponse.java`
  - Timeline entry response
- Create: `flower-shop-backend-java/src/main/java/com/floralwhisper/dto/AboutTimelineEntryRequest.java`
  - Timeline create/update request
- Create: `flower-shop-backend-java/src/main/java/com/floralwhisper/dto/TeamMemberRequest.java`
  - Team member admin create/update request
- Modify: `flower-shop-backend-java/src/main/java/com/floralwhisper/service/SiteService.java`
  - Add about page config lifecycle, timeline CRUD helpers, and team member CRUD helpers
- Modify: `flower-shop-backend-java/src/main/java/com/floralwhisper/controller/SiteController.java`
  - Add public about page and timeline endpoints
- Modify: `flower-shop-backend-java/src/main/java/com/floralwhisper/controller/AdminController.java`
  - Add admin about page, timeline, and team management endpoints
- Modify: `flower-shop-backend-java/src/test/java/com/floralwhisper/controller/AdminControllerTest.java`
  - Add endpoint-level regression coverage for new admin APIs

### Shared / Web Types

- Modify: `shared/types.ts`
  - Add about page config and timeline shared types
- Modify: `flower-shop-web/src/types/index.ts`
  - Re-export new shared types

### Web Admin / Public Web

- Create: `flower-shop-web/src/pages/AdminAbout/AdminAbout.tsx`
  - Dedicated admin page for about page maintenance
- Modify: `flower-shop-web/src/router/index.tsx`
  - Register `/admin/about`
- Modify: `flower-shop-web/src/components/admin/adminMeta.ts`
  - Add about page nav item and page meta
- Modify: `flower-shop-web/src/services/api.ts`
  - Add public/admin about page, timeline, and team CRUD API wrappers
- Modify: `flower-shop-web/src/pages/About/About.tsx`
  - Switch to fully backend-driven rendering
- Modify: `flower-shop-web/src/styles.css`
  - Add any small reusable admin layout helpers needed by the new page

---

### Task 1: Add Backend Schema For About Config And Timeline

**Files:**
- Create: `flower-shop-backend-java/src/main/resources/db/migration/V5__add_about_page_and_timeline.sql`

- [ ] **Step 1: Add the Flyway migration**

```sql
CREATE TABLE about_page (
  id BIGINT NOT NULL PRIMARY KEY,
  hero_image VARCHAR(1024) NOT NULL,
  hero_eyebrow VARCHAR(255) NOT NULL,
  hero_title VARCHAR(255) NOT NULL,
  hero_subtitle VARCHAR(1024) NOT NULL,
  story_title VARCHAR(255) NOT NULL,
  story_content TEXT NOT NULL
);

CREATE TABLE about_timeline_entries (
  id VARCHAR(64) NOT NULL PRIMARY KEY,
  year_label VARCHAR(64) NOT NULL,
  content VARCHAR(1024) NOT NULL,
  sort INT NOT NULL DEFAULT 0,
  INDEX idx_about_timeline_sort (sort)
);
```

- [ ] **Step 2: Run backend tests or app startup path that applies migrations**

Run: `cd flower-shop-backend-java && ./mvnw -q -DskipTests package`

Expected: build succeeds and migration SQL is accepted during packaging

- [ ] **Step 3: Commit**

```bash
git add flower-shop-backend-java/src/main/resources/db/migration/V5__add_about_page_and_timeline.sql
git commit -m "feat: add about page schema"
```

### Task 2: Add Backend Entities, Mappers, And DTOs

**Files:**
- Create: `flower-shop-backend-java/src/main/java/com/floralwhisper/entity/AboutPage.java`
- Create: `flower-shop-backend-java/src/main/java/com/floralwhisper/entity/AboutTimelineEntry.java`
- Create: `flower-shop-backend-java/src/main/java/com/floralwhisper/mapper/AboutPageMapper.java`
- Create: `flower-shop-backend-java/src/main/java/com/floralwhisper/mapper/AboutTimelineEntryMapper.java`
- Create: `flower-shop-backend-java/src/main/java/com/floralwhisper/dto/AboutPageResponse.java`
- Create: `flower-shop-backend-java/src/main/java/com/floralwhisper/dto/AboutPageUpdateRequest.java`
- Create: `flower-shop-backend-java/src/main/java/com/floralwhisper/dto/AboutTimelineEntryResponse.java`
- Create: `flower-shop-backend-java/src/main/java/com/floralwhisper/dto/AboutTimelineEntryRequest.java`
- Create: `flower-shop-backend-java/src/main/java/com/floralwhisper/dto/TeamMemberRequest.java`

- [ ] **Step 1: Add the new entity and mapper classes**

Implement the same style already used by other simple entities/mappers in the backend:

```java
// AboutPage.java
@Data
@TableName("about_page")
public class AboutPage {
  private Long id;
  private String heroImage;
  private String heroEyebrow;
  private String heroTitle;
  private String heroSubtitle;
  private String storyTitle;
  private String storyContent;
}
```

```java
// AboutTimelineEntry.java
@Data
@TableName("about_timeline_entries")
public class AboutTimelineEntry {
  private String id;
  private String yearLabel;
  private String content;
  private Integer sort;
}
```

```java
// AboutPageMapper.java / AboutTimelineEntryMapper.java
@Mapper
public interface AboutPageMapper extends BaseMapper<AboutPage> {}
```

- [ ] **Step 2: Add the DTOs**

Use request/response DTO style matching current backend conventions:

```java
@Data
public class AboutPageUpdateRequest {
  private String heroImage;
  private String heroEyebrow;
  private String heroTitle;
  private String heroSubtitle;
  private String storyTitle;
  private String storyContent;
}
```

```java
@Data
public class AboutTimelineEntryRequest {
  private String id;
  private String yearLabel;
  private String content;
  private Integer sort;
}
```

```java
@Data
public class TeamMemberRequest {
  private String id;
  private String name;
  private String title;
  private String avatar;
  private String bio;
  private Integer sort;
}
```

- [ ] **Step 3: Run backend package build**

Run: `cd flower-shop-backend-java && ./mvnw -q -DskipTests package`

Expected: build succeeds with new classes compiling cleanly

- [ ] **Step 4: Commit**

```bash
git add flower-shop-backend-java/src/main/java/com/floralwhisper/entity/AboutPage.java \
  flower-shop-backend-java/src/main/java/com/floralwhisper/entity/AboutTimelineEntry.java \
  flower-shop-backend-java/src/main/java/com/floralwhisper/mapper/AboutPageMapper.java \
  flower-shop-backend-java/src/main/java/com/floralwhisper/mapper/AboutTimelineEntryMapper.java \
  flower-shop-backend-java/src/main/java/com/floralwhisper/dto/AboutPageResponse.java \
  flower-shop-backend-java/src/main/java/com/floralwhisper/dto/AboutPageUpdateRequest.java \
  flower-shop-backend-java/src/main/java/com/floralwhisper/dto/AboutTimelineEntryResponse.java \
  flower-shop-backend-java/src/main/java/com/floralwhisper/dto/AboutTimelineEntryRequest.java \
  flower-shop-backend-java/src/main/java/com/floralwhisper/dto/TeamMemberRequest.java
git commit -m "feat: add about page backend models"
```

### Task 3: Extend SiteService With About Page, Timeline, And Team CRUD

**Files:**
- Modify: `flower-shop-backend-java/src/main/java/com/floralwhisper/service/SiteService.java`

- [ ] **Step 1: Inject new mappers into SiteService**

Add constructor fields for:

- `AboutPageMapper`
- `AboutTimelineEntryMapper`

and wire them into the existing constructor.

- [ ] **Step 2: Add singleton about page getters and defaults**

Add methods in `SiteService`:

- `public AboutPageResponse getAboutPage()`
- `private AboutPage ensureAboutPage()`
- `private AboutPageResponse toAboutPageResponse(AboutPage page)`

Default singleton content should be seeded conservatively from current About page wording:

```java
created.setHeroEyebrow("About Floral Whisper Time");
created.setHeroTitle("让花束像一封慢慢抵达的信");
created.setHeroSubtitle("花语时光相信，每一束花都应该有清楚的情绪和自然的呼吸。");
created.setStoryTitle("品牌故事");
created.setStoryContent("我们从季节花材出发，为婚礼、日常赠礼、商业空间和私人宴会设计花艺。店铺坚持少量精选、手工制作，用克制的色彩和舒展的结构表达真诚心意。");
```

- [ ] **Step 3: Add about page update and timeline CRUD helpers**

Add service methods:

- `public AboutPageResponse updateAboutPage(AboutPageUpdateRequest request)`
- `public List<AboutTimelineEntryResponse> getAboutTimeline()`
- `public AboutTimelineEntryResponse createAboutTimelineEntry(AboutTimelineEntryRequest request)`
- `public AboutTimelineEntryResponse updateAboutTimelineEntry(String id, AboutTimelineEntryRequest request)`
- `public void deleteAboutTimelineEntry(String id)`

Also add:

- default timeline seeding if table is empty
- `toAboutTimelineEntryResponse(...)`

- [ ] **Step 4: Add team admin CRUD helpers**

Add methods:

- `public List<TeamMember> getAdminTeamMembers()`
- `public TeamMember createTeamMember(TeamMemberRequest request)`
- `public TeamMember updateTeamMember(String id, TeamMemberRequest request)`
- `public void deleteTeamMember(String id)`

Implementation should:

- reuse current `TeamMember` entity/table
- sort by `sort`
- trim text fields
- reject blank ids/names/titles on create/update with `IllegalArgumentException`

- [ ] **Step 5: Run backend package build**

Run: `cd flower-shop-backend-java && ./mvnw -q -DskipTests package`

Expected: build succeeds with service compilation passing

- [ ] **Step 6: Commit**

```bash
git add flower-shop-backend-java/src/main/java/com/floralwhisper/service/SiteService.java
git commit -m "feat: add about page service operations"
```

### Task 4: Add Public And Admin Controller Endpoints

**Files:**
- Modify: `flower-shop-backend-java/src/main/java/com/floralwhisper/controller/SiteController.java`
- Modify: `flower-shop-backend-java/src/main/java/com/floralwhisper/controller/AdminController.java`
- Modify: `flower-shop-backend-java/src/test/java/com/floralwhisper/controller/AdminControllerTest.java`

- [ ] **Step 1: Add public About endpoints**

Expose in `SiteController`:

- `GET /api/about-page`
- `GET /api/about-timeline`

They should delegate directly to `SiteService`.

- [ ] **Step 2: Add authenticated admin endpoints**

Expose in `AdminController`:

- `GET /api/admin/about-page`
- `PUT /api/admin/about-page`
- `GET /api/admin/about-timeline`
- `POST /api/admin/about-timeline`
- `PUT /api/admin/about-timeline/{id}`
- `DELETE /api/admin/about-timeline/{id}`
- `GET /api/admin/team`
- `POST /api/admin/team`
- `PUT /api/admin/team/{id}`
- `DELETE /api/admin/team/{id}`

- [ ] **Step 3: Extend AdminController tests**

Add controller tests for:

- update about page returns 200
- create/update/delete timeline return expected status
- create/update/delete team members return expected status

Keep tests narrow and controller-focused like existing admin endpoint tests.

- [ ] **Step 4: Run backend tests**

Run: `cd flower-shop-backend-java && ./mvnw -q test`

Expected: tests pass

- [ ] **Step 5: Commit**

```bash
git add flower-shop-backend-java/src/main/java/com/floralwhisper/controller/SiteController.java \
  flower-shop-backend-java/src/main/java/com/floralwhisper/controller/AdminController.java \
  flower-shop-backend-java/src/test/java/com/floralwhisper/controller/AdminControllerTest.java
git commit -m "feat: expose about page admin endpoints"
```

### Task 5: Add Shared Types And Web API Wrappers

**Files:**
- Modify: `shared/types.ts`
- Modify: `flower-shop-web/src/types/index.ts`
- Modify: `flower-shop-web/src/services/api.ts`

- [ ] **Step 1: Add shared types**

Add to `shared/types.ts`:

- `AboutPage`
- `AboutTimelineEntry`
- `TeamMemberInput` if needed, or keep team request typing local in web API layer

Example:

```ts
export interface AboutPage {
  heroImage: string;
  heroEyebrow: string;
  heroTitle: string;
  heroSubtitle: string;
  storyTitle: string;
  storyContent: string;
}

export interface AboutTimelineEntry {
  id: string;
  yearLabel: string;
  content: string;
  sort: number;
}
```

- [ ] **Step 2: Re-export types in web**

Update `flower-shop-web/src/types/index.ts` to export the new shared types.

- [ ] **Step 3: Add web API wrappers**

Add to `flower-shop-web/src/services/api.ts`:

- `getAboutPage`
- `getAboutTimeline`
- `getAdminAboutPage`
- `updateAdminAboutPage`
- `getAdminAboutTimeline`
- `createAdminAboutTimeline`
- `updateAdminAboutTimeline`
- `deleteAdminAboutTimeline`
- `getAdminTeamMembers`
- `createAdminTeamMember`
- `updateAdminTeamMember`
- `deleteAdminTeamMember`

Use the existing `request<T>()` and `withMutationGuard()` patterns.

- [ ] **Step 4: Run frontend build**

Run: `cd flower-shop-web && PATH=/root/.local/node-v22.12.0-linux-x64/bin:$PATH /root/.local/node-v22.12.0-linux-x64/bin/node node_modules/typescript/bin/tsc -b`

Expected: type build passes

- [ ] **Step 5: Commit**

```bash
git add shared/types.ts flower-shop-web/src/types/index.ts flower-shop-web/src/services/api.ts
git commit -m "feat: add about page web api types"
```

### Task 6: Add Dedicated Admin About Page

**Files:**
- Create: `flower-shop-web/src/pages/AdminAbout/AdminAbout.tsx`
- Modify: `flower-shop-web/src/router/index.tsx`
- Modify: `flower-shop-web/src/components/admin/adminMeta.ts`
- Modify: `flower-shop-web/src/styles.css`

- [ ] **Step 1: Register admin route and nav metadata**

Add route:

- `/admin/about`

Add nav item:

- label `关于我们`
- description `维护页首、故事、时间轴与团队`

- [ ] **Step 2: Build the page structure**

`AdminAbout.tsx` should include:

- top workspace header
- hero section form
- story form
- timeline management section
- team management section

Recommended local state:

- boot loading
- save loading
- active timeline item for drawer editing
- active team member for drawer editing

- [ ] **Step 3: Add timeline management**

Implement:

- list of timeline items
- add/edit drawer
- delete
- up/down sort by updating `sort`

Use existing admin page patterns:

- `admin-toolbar`
- `admin-panel`
- `admin-subpanel`
- drawer-based editing

- [ ] **Step 4: Add team management**

Implement:

- team cards or table
- add/edit drawer
- avatar upload using existing upload API
- delete
- up/down sort

- [ ] **Step 5: Add minimal style helpers if needed**

Only add small reusable helpers in `styles.css` if the page needs them. Avoid large theme churn.

- [ ] **Step 6: Run frontend build**

Run: `cd flower-shop-web && PATH=/root/.local/node-v22.12.0-linux-x64/bin:$PATH /root/.local/node-v22.12.0-linux-x64/bin/node node_modules/typescript/bin/tsc -b && PATH=/root/.local/node-v22.12.0-linux-x64/bin:$PATH /root/.local/node-v22.12.0-linux-x64/bin/node node_modules/vite/bin/vite.js build`

Expected: both commands pass

- [ ] **Step 7: Commit**

```bash
git add flower-shop-web/src/pages/AdminAbout/AdminAbout.tsx \
  flower-shop-web/src/router/index.tsx \
  flower-shop-web/src/components/admin/adminMeta.ts \
  flower-shop-web/src/styles.css
git commit -m "feat: add admin about content workspace"
```

### Task 7: Switch Public About Page To Backend-Driven Content

**Files:**
- Modify: `flower-shop-web/src/pages/About/About.tsx`

- [ ] **Step 1: Replace current data fetches**

Fetch:

- `getAboutPage()`
- `getAboutTimeline()`
- `getTeamMembers()`
- `getShopInfo()`

Remove dependence on `getBrandStory()` for the About page.

- [ ] **Step 2: Replace hardcoded content**

Render About page from:

- about page hero fields
- about page story fields
- timeline list
- team list
- shop info

Gracefully handle empty timeline and empty team.

- [ ] **Step 3: Run frontend build**

Run: `cd flower-shop-web && PATH=/root/.local/node-v22.12.0-linux-x64/bin:$PATH /root/.local/node-v22.12.0-linux-x64/bin/node node_modules/typescript/bin/tsc -b && PATH=/root/.local/node-v22.12.0-linux-x64/bin:$PATH /root/.local/node-v22.12.0-linux-x64/bin/node node_modules/vite/bin/vite.js build`

Expected: build passes and public About page compiles cleanly

- [ ] **Step 4: Commit**

```bash
git add flower-shop-web/src/pages/About/About.tsx
git commit -m "feat: render about page from admin content"
```

### Task 8: End-To-End Verification And Docker Rollout

**Files:**
- Modify: none expected, verification only

- [ ] **Step 1: Run backend tests**

Run: `cd flower-shop-backend-java && ./mvnw -q test`

Expected: PASS

- [ ] **Step 2: Run frontend build**

Run: `cd flower-shop-web && PATH=/root/.local/node-v22.12.0-linux-x64/bin:$PATH /root/.local/node-v22.12.0-linux-x64/bin/node node_modules/typescript/bin/tsc -b && PATH=/root/.local/node-v22.12.0-linux-x64/bin:$PATH /root/.local/node-v22.12.0-linux-x64/bin/node node_modules/vite/bin/vite.js build`

Expected: PASS

- [ ] **Step 3: Rebuild Docker web/backend services**

Run: `docker compose -p floralwhispertime up -d --build backend web`

Expected: services become healthy and web serves updated app

- [ ] **Step 4: Verify routes**

Run:

```bash
curl -I http://127.0.0.1:8081/about
curl -I http://127.0.0.1:8081/admin/about
```

Expected: both return `200 OK`

- [ ] **Step 5: Commit final cleanup if any**

```bash
git status --short
```

Expected: no unintended tracked-file changes remain

## Self-Review

- Spec coverage: covered about hero, story, timeline, team, backend APIs, dedicated admin page, public page switch, sorting, avatar upload, verification
- Placeholder scan: no TODO/TBD placeholders remain
- Type consistency: `AboutPage`, `AboutTimelineEntry`, and team CRUD naming are consistent across backend/web plan steps
