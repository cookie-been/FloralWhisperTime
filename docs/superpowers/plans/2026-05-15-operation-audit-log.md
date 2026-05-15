# Operation Audit Log Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 为后台所有写操作和关键安全操作增加可检索、可追溯、可按快照恢复的数据审计能力。

**Architecture:** 在 Java 后端新增 `operation_logs` 审计表、统一审计服务和恢复服务；所有后台写接口在业务层记录变更前后快照；前端后台新增一级“操作日志”页面用于筛选、查看详情和执行恢复。恢复动作继续写入新日志，形成完整链路。

**Tech Stack:** Spring Boot 3、MyBatis-Plus、Flyway、React 19、Ant Design 6、Vite 7。

---

### Task 1: 建立审计日志存储模型

**Files:**
- Create: `flower-shop-backend-java/src/main/resources/db/migration/V9__add_operation_logs.sql`
- Create: `flower-shop-backend-java/src/main/java/com/floralwhisper/entity/OperationLog.java`
- Create: `flower-shop-backend-java/src/main/java/com/floralwhisper/mapper/OperationLogMapper.java`
- Create: `flower-shop-backend-java/src/main/java/com/floralwhisper/dto/OperationLogResponse.java`
- Create: `flower-shop-backend-java/src/main/java/com/floralwhisper/dto/OperationLogDetailResponse.java`
- Create: `flower-shop-backend-java/src/main/java/com/floralwhisper/dto/OperationLogRestoreRequest.java`

- [ ] 定义 `operation_logs` 表，包含模块、动作、目标类型、目标 ID、操作者、请求摘要、before/after JSON、success、error_message、ip、user_agent、created_at、restored_from_log_id 等字段。
- [ ] 建立实体和 Mapper，沿用 MyBatis-Plus 模式。
- [ ] 定义前端列表和详情所需响应 DTO，以及恢复请求 DTO。

### Task 2: 建立统一审计上下文与记录服务

**Files:**
- Create: `flower-shop-backend-java/src/main/java/com/floralwhisper/audit/AuditContext.java`
- Create: `flower-shop-backend-java/src/main/java/com/floralwhisper/audit/AuditContextHolder.java`
- Create: `flower-shop-backend-java/src/main/java/com/floralwhisper/audit/AuditLogService.java`
- Create: `flower-shop-backend-java/src/main/java/com/floralwhisper/audit/AuditPayloadSanitizer.java`
- Create: `flower-shop-backend-java/src/main/java/com/floralwhisper/config/WebAuditInterceptor.java`
- Modify: `flower-shop-backend-java/src/main/java/com/floralwhisper/config/SecurityConfig.java`
- Modify: `flower-shop-backend-java/src/main/resources/application.yml`

- [ ] 从请求中提取当前管理员用户名、IP、UA，放入线程级审计上下文。
- [ ] 审计服务支持记录成功/失败日志，并对密钥、密码等敏感字段脱敏。
- [ ] 仅对后台写操作和登录记录，不记录普通查询。

### Task 3: 接入业务写操作与恢复能力

**Files:**
- Modify: `flower-shop-backend-java/src/main/java/com/floralwhisper/service/AuthService.java`
- Modify: `flower-shop-backend-java/src/main/java/com/floralwhisper/service/FlowerService.java`
- Modify: `flower-shop-backend-java/src/main/java/com/floralwhisper/service/ContactService.java`
- Modify: `flower-shop-backend-java/src/main/java/com/floralwhisper/service/SiteService.java`
- Create: `flower-shop-backend-java/src/main/java/com/floralwhisper/service/OperationLogRecoveryService.java`

- [ ] 在登录成功/失败时写审计日志。
- [ ] 在作品、站点配置、关于页、时间轴、团队、留言已读、AI 配置等写操作里记录 before/after。
- [ ] 实现按单条日志恢复：支持作品、站点配置、关于页、时间轴、团队成员、留言已读、AI 配置恢复到变更前快照。
- [ ] 恢复动作本身生成新的审计日志，并标注来源日志 ID。

### Task 4: 暴露后台日志接口

**Files:**
- Modify: `flower-shop-backend-java/src/main/java/com/floralwhisper/controller/AdminController.java`
- Create: `flower-shop-backend-java/src/main/java/com/floralwhisper/service/OperationLogQueryService.java`

- [ ] 新增日志列表接口，支持按模块、动作、操作者、成功状态、关键词分页筛选。
- [ ] 新增日志详情接口。
- [ ] 新增恢复接口，并限制为管理员 Bearer token。

### Task 5: 新增后台日志页面

**Files:**
- Modify: `flower-shop-web/src/router/index.tsx`
- Modify: `flower-shop-web/src/components/admin/adminMeta.ts`
- Modify: `flower-shop-web/src/services/api.ts`
- Modify: `shared/types.ts`
- Create: `flower-shop-web/src/pages/AdminOperationLogs/AdminOperationLogs.tsx`

- [ ] 新增“操作日志”一级菜单，与现有后台菜单平级。
- [ ] 页面提供筛选、列表、详情抽屉、恢复按钮和风险提示。
- [ ] 对恢复前日志给出明确确认，恢复成功后刷新列表。

### Task 6: 补测试与验证

**Files:**
- Create: `flower-shop-backend-java/src/test/java/com/floralwhisper/service/OperationLogRecoveryServiceTest.java`
- Modify: `flower-shop-backend-java/src/test/java/com/floralwhisper/controller/AdminControllerTest.java`
- Modify: `flower-shop-backend-java/src/test/java/com/floralwhisper/controller/FlowerControllerTest.java`
- Modify: `flower-shop-backend-java/src/test/java/com/floralwhisper/service/SiteServiceTest.java`

- [ ] 先补失败测试，覆盖写操作日志记录、敏感字段脱敏、单条恢复和恢复后二次记日志。
- [ ] 跑 `mvn test` 验证后端。
- [ ] 用 Docker 构建或既有部署链路验证前端构建与运行。
