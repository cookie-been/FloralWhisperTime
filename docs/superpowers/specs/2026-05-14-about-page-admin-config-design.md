# About Page Admin Config Design

## Goal

Make the public `About` page fully manageable from the admin side, covering:

- Hero image
- Hero eyebrow / title / subtitle
- Brand story main body
- Timeline entries
- Team members

The admin UX should support list-style maintenance for timeline entries and team members, including add, edit, delete, and sort. Team members should support avatar upload.

## Scope

In scope:

- New admin-managed `About` page content model
- Backend read/update APIs for About page content
- Backend CRUD-style admin APIs for timeline entries
- Backend CRUD-style admin APIs for team members
- Web admin page for maintaining About content
- Public About page switched to backend-driven rendering

Out of scope:

- Changes to mini program About page in this task
- Multi-language support
- Rich text editor

## Recommended Approach

Use a dedicated `About` admin surface rather than appending everything into the existing `站点配置` form.

Reasoning:

- The current settings page already manages home, stats, contact, and story content
- Adding hero, timeline, and team maintenance there would create a very long mixed-purpose editing surface
- About content has its own clear ownership boundary and should remain independently evolvable

## Data Design

### 1. About Page Config

Add a singleton-style config object for public About page static sections:

- `heroImage`
- `heroEyebrow`
- `heroTitle`
- `heroSubtitle`
- `storyTitle`
- `storyContent`

This object is responsible only for the fixed non-list content on the About page.

### 2. Timeline Entries

Store timeline as a sortable list:

- `id`
- `yearLabel`
- `content`
- `sort`

Behavior:

- Admin can add, edit, delete
- Admin can reorder entries
- Public page renders sorted ascending by `sort`

### 3. Team Members

Continue using the existing team member model, but expose full admin maintenance:

- `id`
- `name`
- `title`
- `avatar`
- `bio`
- `sort`

Behavior:

- Admin can add, edit, delete
- Admin can reorder
- Avatar upload uses the existing upload endpoint

## Backend Design

### Public APIs

Keep or extend public endpoints so the About page can fetch:

- `GET /api/about-page`
- `GET /api/about-timeline`
- `GET /api/team`

If desired, `GET /api/brand-story` may remain for compatibility, but the public About page should move to the dedicated About config model.

### Admin APIs

Add authenticated admin APIs:

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

Reordering can be handled by updating `sort` through the existing update endpoints; no separate reorder endpoint is required for this phase.

## Web Admin Design

Add a dedicated admin page, recommended route:

- `/admin/about`

And add a same-level nav item:

- `关于我们`

### Page Sections

1. Hero section
- image upload / URL
- eyebrow
- title
- subtitle

2. Story section
- story title
- story content

3. Timeline workspace
- list of entries
- add / edit / delete
- up / down ordering controls

4. Team workspace
- card or table list
- add / edit / delete
- avatar upload
- up / down ordering controls

### UX Principles

- Reuse current admin visual system
- Keep forms segmented and not over-nested
- Use drawer-based editing where it matches existing patterns
- Use conservative enterprise-style presentation

## Public About Page Design

Replace hardcoded timeline content with backend-driven content.

Page structure remains:

1. Hero
2. Story + contact summary
3. Timeline
4. Team

But all values should come from:

- About page config
- Timeline list
- Team list
- Shop info

## Error Handling

- Empty timeline should render a graceful empty block, not break layout
- Empty team should render a graceful empty block
- Missing hero image should fall back to a neutral background
- Admin save failures should surface message feedback using current patterns

## Verification Plan

- Create/update About hero content from admin and verify public About page reflects it
- Add, edit, delete timeline entries and verify order/rendering
- Add, edit, delete team members and verify order/rendering
- Upload team avatar and verify public rendering
- Verify `tsc -b` and `vite build`
- Rebuild Docker web service and confirm `/about` and `/admin/about` respond correctly

## Risks

- Existing `BrandStory` overlaps semantically with the new About config
- Team members already exist in backend, so data boundaries must remain explicit
- If all About data is mixed into the current site config model, future maintenance will degrade quickly

## Chosen Decisions

- Dedicated admin page for About content
- Dedicated About singleton config for hero/story static sections
- Timeline managed as sortable list
- Team members managed as sortable list with avatar upload
- Sorting handled through normal update operations in this phase
