# 后台 AI 作品信息建议 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 为后台 AI 生图流程增加可编辑的作品信息建议，并在“用于新建作品”时一起带入作品表单。

**Architecture:** 后端在现有 `AdminAiController` 下新增一个结构化文案建议接口，复用 `ai_settings` 存储文案模型配置，通过 Ark 文本接口返回 JSON。前端在 `AdminFlowers` 的 AI 生图抽屉中增加“作品信息建议”面板，支持生成、修改和带入新增作品表单。

**Tech Stack:** Spring Boot 3, MyBatis-Plus, Flyway, React 19, Ant Design 6, TypeScript, Vite 7

---

### Task 1: 扩展 AI 配置存储与类型

**Files:**
- Modify: `shared/types.ts`
- Modify: `flower-shop-backend-java/src/main/java/com/floralwhisper/entity/AiSettings.java`
- Modify: `flower-shop-backend-java/src/main/java/com/floralwhisper/dto/AiSettingsResponse.java`
- Modify: `flower-shop-backend-java/src/main/java/com/floralwhisper/dto/AiSettingsUpdateRequest.java`
- Modify: `flower-shop-backend-java/src/main/java/com/floralwhisper/service/SiteService.java`
- Create: `flower-shop-backend-java/src/main/resources/db/migration/V8__add_ai_text_settings.sql`

- [ ] 写迁移与类型扩展，支持 `textModel/textGeneratePath/textTemperature/textMaxTokens`
- [ ] 确保 `site-config` 读取和更新都能覆盖新增字段
- [ ] 保持老的生图配置字段兼容

### Task 2: 新增后端作品信息建议接口

**Files:**
- Create: `flower-shop-backend-java/src/main/java/com/floralwhisper/dto/AiFlowerSuggestionRequest.java`
- Create: `flower-shop-backend-java/src/main/java/com/floralwhisper/dto/AiFlowerSuggestionResponse.java`
- Create: `flower-shop-backend-java/src/main/java/com/floralwhisper/service/ai/ResolvedAiTextSettings.java`
- Modify: `flower-shop-backend-java/src/main/java/com/floralwhisper/service/ai/AiSettingsResolver.java`
- Create: `flower-shop-backend-java/src/main/java/com/floralwhisper/service/ai/VolcengineFlowerSuggestionService.java`
- Modify: `flower-shop-backend-java/src/main/java/com/floralwhisper/controller/AdminAiController.java`

- [ ] 先写控制器测试，覆盖未登录、空 prompt、成功返回建议
- [ ] 再实现结构化建议服务，要求返回稳定 JSON
- [ ] 服务端完成分类合法性、长度和数组数量收口

### Task 3: 接入前端 AI 建议面板

**Files:**
- Modify: `flower-shop-web/src/services/api.ts`
- Modify: `flower-shop-web/src/pages/AdminFlowers/AdminFlowers.tsx`

- [ ] 新增前端建议请求方法和类型
- [ ] 在 AI 生图抽屉增加“作品信息建议”可编辑面板
- [ ] 支持“生成作品信息”“重新生成建议”“用于新建作品”带入全部字段
- [ ] 确保建议失败时仍可只带图进入作品新增流程

### Task 4: 更新后台配置页

**Files:**
- Modify: `flower-shop-web/src/pages/AdminSettings/AdminSettings.tsx`

- [ ] 增加文本模型配置项录入和摘要展示
- [ ] 保持现有 AI 生图配置布局风格一致

### Task 5: 更新文档

**Files:**
- Modify: `docs/api.md`
- Modify: `flower-shop-backend-java/README.md`

- [ ] 增补 AI 文案建议接口说明
- [ ] 增补 AI 配置新增字段说明

### Task 6: 验证与提交

**Files:**
- N/A

- [ ] 运行 `mvn test`
- [ ] 运行 `docker run --rm -v /workspace/FloralWhisperTime:/app -w /app/flower-shop-web node:22.12.0-alpine sh -lc 'npm run build'`
- [ ] 重建并重启 Docker 服务验证页面联调
- [ ] 使用中文提交信息提交代码
