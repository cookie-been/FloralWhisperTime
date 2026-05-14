# AI Settings Security Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 将 AI 配置从公开接口剥离，改为后台专用安全读取和更新。

**Architecture:** 后端在 `AdminController` 下新增系统 AI 配置接口，公开站点配置接口移除 `aiSettings`。前端 `AdminSettings` 页面拆分站点配置保存和 AI 配置保存，AI 区块通过后台专用接口单独读写。

**Tech Stack:** Spring Boot 3, React 19, Ant Design 6, TypeScript

---

### Task 1: 调整后端接口边界

**Files:**
- Modify: `flower-shop-backend-java/src/main/java/com/floralwhisper/controller/SiteController.java`
- Modify: `flower-shop-backend-java/src/main/java/com/floralwhisper/controller/AdminController.java`
- Modify: `flower-shop-backend-java/src/main/java/com/floralwhisper/service/SiteService.java`
- Modify: `flower-shop-backend-java/src/main/java/com/floralwhisper/dto/AiSettingsResponse.java`

- [ ] 公开接口移除 `aiSettings`
- [ ] 新增后台 AI 配置接口
- [ ] `apiKey` 改为脱敏和配置状态字段

### Task 2: 补后端测试

**Files:**
- Modify: `flower-shop-backend-java/src/test/java/com/floralwhisper/controller/SiteControllerTest.java`
- Modify: `flower-shop-backend-java/src/test/java/com/floralwhisper/controller/AdminControllerTest.java`

- [ ] 测公开接口不再返回 `aiSettings`
- [ ] 测后台接口鉴权和响应结构

### Task 3: 前端改读写链路

**Files:**
- Modify: `shared/types.ts`
- Modify: `flower-shop-web/src/services/api.ts`
- Modify: `flower-shop-web/src/pages/AdminSettings/AdminSettings.tsx`
- Modify: `flower-shop-web/src/pages/AdminFlowers/AdminFlowers.tsx`

- [ ] 新增后台 AI 配置 API 封装
- [ ] `AdminSettings` 单独加载和保存 AI 配置
- [ ] `AdminFlowers` 改走后台专用 AI 配置读取

### Task 4: 验证

**Files:**
- N/A

- [ ] 运行后端测试
- [ ] 运行前端构建
- [ ] Docker 运行时验证
