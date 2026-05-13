# Admin Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebuild the web admin experience into a branded dashboard-first console with a new login page, shared admin shell, dashboard landing page, redesigned flower workspace, and reorganized settings workspace.

**Architecture:** Keep the existing API layer and auth token behavior, but split admin UI into a dedicated shell plus page-specific sections and drawers. Route `/admin` to a new dashboard and render all authenticated admin pages inside a shared layout that provides navigation, page framing, and action space.

**Tech Stack:** React 19, React Router 7, Ant Design 6, Tailwind CSS 3, TypeScript, existing fetch-based service layer

---

### Task 1: Add shared admin scaffolding

**Files:**
- Create: `flower-shop-web/src/components/admin/AdminShell.tsx`
- Create: `flower-shop-web/src/components/admin/adminMeta.ts`
- Create: `flower-shop-web/src/pages/AdminDashboard/AdminDashboard.tsx`
- Modify: `flower-shop-web/src/router/index.tsx`
- Modify: `flower-shop-web/src/services/api.ts`

- [ ] **Step 1: Add a lightweight admin metadata module**

Create `flower-shop-web/src/components/admin/adminMeta.ts` with navigation metadata and page copy so the shell and routes can share labels:

```ts
import { BarChart3, Flower2, Globe, Settings } from "lucide-react";

export const adminNavItems = [
  { key: "dashboard", path: "/admin", label: "运营总览", description: "查看站点与作品状态", icon: BarChart3 },
  { key: "flowers", path: "/admin/flowers", label: "作品管理", description: "维护花束内容与封面", icon: Flower2 },
  { key: "settings", path: "/admin/settings", label: "站点配置", description: "更新首页、门店与品牌故事", icon: Settings },
] as const;

export const adminPublicLink = { path: "/", label: "查看网站", icon: Globe };
```

- [ ] **Step 2: Extend API helpers for dashboard summary data**

Add a tolerant request path for dashboard composition in `flower-shop-web/src/services/api.ts`:

```ts
export async function getDashboardData() {
  const [flowers, categories, siteConfig, shopInfo, brandStory] = await Promise.all([
    getFlowers({ limit: 200 }),
    getCategories(),
    getSiteConfig(),
    getShopInfo(),
    getBrandStory(),
  ]);

  return { flowers: flowers.list, categories, siteConfig, shopInfo, brandStory };
}
```

- [ ] **Step 3: Add the shared admin shell**

Create `flower-shop-web/src/components/admin/AdminShell.tsx` with:

- left sidebar brand block
- nav links from `adminMeta`
- public-site link
- logout action
- top header using route pathname to resolve current title/description
- `<Outlet />` content area

Use `useLocation`, `NavLink`, `Outlet`, `clearAdminToken`, and `message`.

- [ ] **Step 4: Add the dashboard page**

Create `flower-shop-web/src/pages/AdminDashboard/AdminDashboard.tsx` that:

- loads `getDashboardData()`
- computes:
  - total flowers
  - featured flowers
  - category count excluding `all`
  - latest flower by newest `createdAt`
- renders:
  - stat cards
  - hero preview
  - quick action buttons
  - recent flowers list
  - site content summary

- [ ] **Step 5: Route authenticated admin pages through the shell**

Update `flower-shop-web/src/router/index.tsx` so protected admin routing becomes:

```tsx
{
  path: "admin",
  element: <ProtectedAdminRoute />,
  children: [
    {
      element: <AdminShell />,
      children: [
        { index: true, element: <AdminDashboard /> },
        { path: "flowers", element: <AdminFlowers /> },
        { path: "settings", element: <AdminSettings /> },
      ],
    },
  ],
}
```

- [ ] **Step 6: Verify routing types still build**

Run: `bash -lc 'PATH="$HOME/.local/node-v22.12.0-linux-x64/bin:$PATH" npm run build'`

Expected: TypeScript and Vite build succeed.

### Task 2: Redesign the login page

**Files:**
- Modify: `flower-shop-web/src/pages/AdminLogin/AdminLogin.tsx`

- [ ] **Step 1: Rework redirect target**

Change login redirect fallback from `/admin/flowers` to `/admin`.

- [ ] **Step 2: Replace current centered card layout with branded split layout**

Update `AdminLogin.tsx` to render:

- desktop two-column layout
- left visual/brand panel with short admin framing
- right compact login surface
- mobile stacked layout

Keep existing auth call and validation logic.

- [ ] **Step 3: Verify login page compiles**

Run: `bash -lc 'PATH="$HOME/.local/node-v22.12.0-linux-x64/bin:$PATH" npm run build'`

Expected: Build succeeds after login page change.

### Task 3: Redesign flower management into a workspace

**Files:**
- Modify: `flower-shop-web/src/pages/AdminFlowers/AdminFlowers.tsx`

- [ ] **Step 1: Add local filter and selection state**

Add page state for:

- keyword search
- category filter
- featured filter
- selected flower
- drawer open state

Use client-side filtering on the loaded flower list to keep scope aligned with current API use.

- [ ] **Step 2: Replace modal editing with drawer editing**

Swap the current `Modal` for `Drawer` and keep the existing form transformation helpers. The drawer should support:

- create mode
- edit mode
- grouped sections
- save and close behavior

- [ ] **Step 3: Restructure page layout**

Render:

- page summary header
- toolbar with search and filters
- table with improved columns
- right drawer form

Add page-level quick metrics from the currently loaded flower list.

- [ ] **Step 4: Improve image editing flow**

Keep `Upload` behavior, but add a visible image preview list above the textarea so the current image set is scannable before save.

- [ ] **Step 5: Verify flower page compiles**

Run: `bash -lc 'PATH="$HOME/.local/node-v22.12.0-linux-x64/bin:$PATH" npm run build'`

Expected: Build succeeds after workspace refactor.

### Task 4: Reorganize site settings into grouped sections

**Files:**
- Modify: `flower-shop-web/src/pages/AdminSettings/AdminSettings.tsx`

- [ ] **Step 1: Split settings page into sectioned workspace**

Refactor the page into grouped sections:

- 品牌与首页
- 首页统计
- 门店与联系
- 品牌故事

Keep the current form model and existing save API payload.

- [ ] **Step 2: Add section navigation and previews**

Add a compact section nav near the top and field-adjacent preview blocks for:

- brand + hero
- hero image
- story image list

Use existing form values rather than introducing a separate preview store.

- [ ] **Step 3: Add stable top action area**

Move save action into a persistent page header area so it remains easy to reach even on long forms.

- [ ] **Step 4: Verify settings page compiles**

Run: `bash -lc 'PATH="$HOME/.local/node-v22.12.0-linux-x64/bin:$PATH" npm run build'`

Expected: Build succeeds after settings refactor.

### Task 5: Adjust global admin styling and final verification

**Files:**
- Modify: `flower-shop-web/src/styles.css`
- Modify: `flower-shop-web/src/main.tsx`

- [ ] **Step 1: Add admin-specific utility styles**

Extend `styles.css` with a small set of admin surface helpers only if plain Tailwind classes become too repetitive. Keep them limited to:

- admin background treatment
- subtle panel shadow
- muted floral highlight

- [ ] **Step 2: Tune Ant Design theme tokens if needed**

Adjust `ConfigProvider` tokens in `main.tsx` only if the redesigned admin surfaces need better alignment for:

- border radius
- primary green
- neutral backgrounds

- [ ] **Step 3: Run final build verification**

Run: `bash -lc 'PATH="$HOME/.local/node-v22.12.0-linux-x64/bin:$PATH" npm run build'`

Expected: `tsc -b && vite build` completes successfully.

- [ ] **Step 4: Manual route smoke check**

Verify in the running dev server:

- `/admin/login`
- `/admin`
- `/admin/flowers`
- `/admin/settings`

Expected:

- login redirects to dashboard on success
- logout returns to login
- admin shell navigation works
- flower drawer opens and closes
- settings sections render and save action is visible
