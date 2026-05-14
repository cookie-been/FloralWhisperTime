# System Status Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 为后台增加系统状态页，显示版本、目录、AI 状态和最近备份信息。

**Architecture:** 后端 `AdminController` 下新增系统状态接口，前端增加 `AdminSystemStatus` 页面并挂到现有后台菜单。页面使用现有后台面板与统计卡风格，不单独造视觉体系。

**Tech Stack:** Spring Boot 3, React 19, Ant Design 6, TypeScript

---

### Task 1: 新增后端状态接口

**Files:**
- Create: `flower-shop-backend-java/src/main/java/com/floralwhisper/dto/SystemStatusResponse.java`
- Modify: `flower-shop-backend-java/src/main/java/com/floralwhisper/service/SiteService.java`
- Modify: `flower-shop-backend-java/src/main/java/com/floralwhisper/controller/AdminController.java`
- Modify: `flower-shop-backend-java/src/test/java/com/floralwhisper/controller/AdminControllerTest.java`

- [ ] 输出系统状态 DTO
- [ ] 返回版本、目录、数据库、AI、最近备份信息
- [ ] 补鉴权和响应测试

### Task 2: 新增前端状态页

**Files:**
- Modify: `flower-shop-web/src/services/api.ts`
- Modify: `flower-shop-web/src/components/admin/adminMeta.ts`
- Modify: `flower-shop-web/src/router/index.tsx`
- Create: `flower-shop-web/src/pages/AdminSystemStatus/AdminSystemStatus.tsx`
- Modify: `flower-shop-web/src/types/index.ts`

- [ ] 封装状态接口
- [ ] 增加后台菜单与路由
- [ ] 页面展示状态摘要和明细

### Task 3: 验证

**Files:**
- N/A

- [ ] 运行后端测试
- [ ] 运行前端构建
- [ ] Docker 联调验证状态页
