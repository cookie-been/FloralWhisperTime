# Button Theme Unification Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 统一整个系统按钮背景与交互状态，让前后台按钮风格一致。

**Architecture:** 以 `ConfigProvider` 的 `Button` 主题 token 为主，统一标准按钮风格；再用 `styles.css` 收口已有自定义按钮类和局部状态，避免逐页散改 JSX。

**Tech Stack:** React 19, Ant Design 6, TypeScript, Vite 7, Tailwind CSS 3

---

### Task 1: 统一按钮主题令牌

**Files:**
- Modify: `flower-shop-web/src/main.tsx`

- [ ] 调整 `Button` token 的主按钮、默认按钮、危险按钮、文字按钮与禁用态

### Task 2: 收口全局按钮 CSS

**Files:**
- Modify: `flower-shop-web/src/styles.css`

- [ ] 统一 `.ant-btn` 基础背景、边框、阴影和过渡
- [ ] 统一 `.ant-btn-primary`、`.ant-btn-default`、`.ant-btn-dangerous`
- [ ] 补齐 `.admin-action-button` 和 `.gallery-search-button`

### Task 3: 构建验证

**Files:**
- N/A

- [ ] 运行前端构建
- [ ] 重建 Docker Web 容器验证页面可加载
