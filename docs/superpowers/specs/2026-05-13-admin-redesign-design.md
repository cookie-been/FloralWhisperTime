# Admin Redesign Design

## Context

The current admin experience in `flower-shop-web` works, but it behaves like a pair of isolated forms rather than a coherent management console. The existing flow has three problems:

1. There is no default admin landing page that summarizes site state.
2. Flower management relies on a table plus blocking modal, which slows browsing and editing.
3. Site settings are presented as one long undifferentiated form, making scanning and targeted edits harder than necessary.

The redesign should keep the current feature scope intact while rebuilding the admin UI into a branded management console that feels aligned with the flower shop identity and is optimized for overview-first operations.

## Goals

- Redesign the admin login page, authenticated admin shell, and admin route structure as one coherent experience.
- Make `/admin` a meaningful dashboard instead of only a parent route.
- Prioritize overview management: the first screen should communicate the current state of flowers and site content before the user edits anything.
- Improve editing efficiency for flowers and site settings without changing backend APIs.
- Preserve the existing admin feature set: flower CRUD, image upload, and site configuration editing.

## Non-Goals

- No backend API changes.
- No new persistence model.
- No new admin modules such as customer messages or asset library in this implementation.
- No permission model beyond the existing single admin token flow.

## User Experience Direction

The new admin UI should feel like a branded operations console:

- Closer to a premium boutique CMS than a generic enterprise panel.
- Branded with soft floral tones and restrained decorative treatment.
- Dense enough for repeated admin use, but not visually sterile.
- Focused on clear scan paths, large state signals, and fast transitions between overview and editing.

This means:

- Fixed sidebar navigation.
- Stable top bar with page title and page-level actions.
- Sectioned content bands rather than one giant white card.
- Reusable status blocks, summary panels, and editing surfaces.

## Information Architecture

### Routes

- `/admin/login`: redesigned login page
- `/admin`: dashboard landing page
- `/admin/flowers`: flower management workspace
- `/admin/settings`: site settings workspace

The existing protected route remains the authentication gate. The new behavior is:

- Successful login redirects to `/admin`
- Protected admin routes render inside a shared admin shell
- Sidebar navigation includes:
  - Dashboard
  - Flower Management
  - Site Settings
  - View Website
  - Logout

`View Website` links back to the public site in the same tab using normal navigation.

## Layout System

### Shared Admin Shell

Create a dedicated authenticated admin layout separate from the public `Layout`.

Core structure:

- Fixed left sidebar
  - Brand block
  - Navigation list
  - Utility actions at the bottom
- Top header
  - Current page title
  - Short page description
  - Contextual action area
- Main content
  - Responsive grid and section bands
  - No nested card stacks

Visual guidance:

- Sidebar uses a darker botanical tone with soft contrast, not pure black.
- Main background uses warm neutral or pale floral green rather than flat gray.
- Cards and panels stay compact with 8px radius or less.
- Use icons for navigation and actions where they improve scanning.

### Responsive Behavior

- Desktop and laptop are primary targets.
- Tablet should remain usable.
- On narrow widths, sidebar may collapse into a drawer or icon rail if needed, but desktop-first behavior is the priority.

## Page Designs

## 1. Login Page

### Purpose

Unify the admin brand experience before authentication and make the transition into the dashboard feel intentional rather than utilitarian.

### Structure

- Two-column split on desktop:
  - Left: brand/atmosphere panel with short operational framing
  - Right: login form
- Single-column stacked layout on mobile

### Content

Left side should communicate:

- Brand name
- Short statement about managing flowers, homepage content, and store presentation
- Optional concise visual cues such as mini status chips or summary bullets

Right side should include:

- Username and password fields
- Primary submit button
- Minimal helper text

### Behavior

- If already authenticated, redirect to `/admin`
- On success, redirect to `/admin`

## 2. Dashboard Page

### Purpose

Make `/admin` the operational home for overview management.

### Primary Content

Top summary row:

- Total flowers
- Featured flowers count
- Category count
- Latest update indicator derived from the newest flower `createdAt`, because the current model does not expose a separate `updatedAt`

Second row:

- Brand hero preview block using the current homepage hero image and title
- Quick actions:
  - Add Flower
  - Manage Flowers
  - Edit Homepage Content

Lower sections:

- Flower status panel
  - Recently added or recently sorted flowers
  - Flowers without featured status
  - Signals that help identify content needing attention
- Site content panel
  - Brand name
  - Hero title
  - Contact summary
  - Brand story summary

### Data Sources

This page should compose existing data from:

- `getFlowers`
- `getCategories`
- `getSiteConfig`
- `getShopInfo`
- `getBrandStory`

No new endpoint is required.

### Interaction

- Quick actions navigate into existing admin pages with relevant intent.
- Recent flower items can link directly into flower editing workflow.

## 3. Flower Management Page

### Purpose

Convert flower management from modal-heavy CRUD into a workspace that supports browsing and editing in parallel.

### Structure

Top toolbar:

- Search input
- Category filter
- Featured status filter
- Primary `New Flower` action

Main workspace:

- Left: flower table/list
- Right: editing drawer or side panel

### List Content

Each row should expose:

- Cover image
- Name
- Category
- Price
- Tags
- Featured state
- Sort value or ordering signal

### Editing Surface

Replace the current modal with a right-side drawer.

Drawer sections:

- Basic information
- Display and sorting
- Description and meaning
- Materials and tags
- Images

### Image Handling

Image management should prefer upload-driven flow while still allowing URL input:

- Existing uploaded or entered image URLs displayed as a list
- Upload button appends a new URL after successful upload
- Text area remains available for manual URL entry and batch edits

### Behavior

- Opening an existing flower loads it into the drawer without leaving the list context
- Creating a flower opens the same drawer with empty defaults
- Save closes the drawer and refreshes the list
- Delete remains confirm-protected

## 4. Site Settings Page

### Purpose

Turn the long form into grouped content editing with better orientation and faster targeted updates.

### Section Groups

- Brand and Homepage
- Statistics
- Contact and Store Info
- Brand Story

### Layout

- Sticky or consistently visible page-level save action
- Section navigation near top, preferably tabs or anchor-like segmented control
- Each section presented as its own compact content panel

### Preview Signals

This page should include lightweight previews where they materially aid editing:

- Brand name and hero content preview
- Hero image preview
- Story image preview

These are not full live page previews. They are field-adjacent signals to improve confidence.

### Behavior

- Load all current content in one initial request batch as it does today
- Save through the existing `updateSiteConfig` flow
- Preserve current data transformation behavior for `storyImages`

## Component Plan

Add or extract a small set of admin-focused components:

- `AdminShell`
- `AdminSidebar`
- `AdminHeader`
- `AdminSection`
- `AdminStatCard`
- `AdminQuickAction`
- `FlowerEditorDrawer`
- `SettingsSectionNav`

These components should be local to the web app and scoped to admin use unless they are clearly generic.

## Data and State Strategy

- Keep using the existing API service layer in `src/services/api.ts`
- Keep page-local state unless a shared admin concern emerges naturally
- Dashboard performs one combined page load with `Promise.all`
- Flower page owns list, filters, drawer state, and reload behavior
- Settings page owns form state and preview derivations

No new global state library is needed.

## Error Handling

- Preserve current `message.error` and `message.success` usage for API results
- Add loading and empty states that fit the redesigned surfaces
- Dashboard should degrade gracefully if one dataset fails, but first implementation may keep the current all-or-error fetch behavior if needed for scope control

## Testing and Verification

This repo currently has no test framework. Verification for this redesign should therefore be execution-based:

- `npm run build` in `flower-shop-web`
- Manual route verification in browser:
  - `/admin/login`
  - `/admin`
  - `/admin/flowers`
  - `/admin/settings`
- Authentication flow verification:
  - unauthenticated redirect behavior
  - login redirect to dashboard
  - logout behavior
- Flower CRUD smoke check
- Settings save smoke check

## Implementation Notes

- Keep backend contract unchanged.
- Keep current auth token storage flow unchanged.
- Introduce the new admin route structure with minimal disruption to public routes.
- Favor refactoring the current admin pages into smaller admin-specific components as part of the redesign, because the current files are large enough that the layout shift would otherwise make them harder to maintain.

## Scope Summary

This design is intentionally scoped to one implementation cycle:

- redesign login page
- add admin dashboard route
- add branded admin shell
- redesign flower management interaction model
- redesign settings information architecture

It does not include additional modules, analytics, or backend changes.
