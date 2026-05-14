# 后台 AI 作品生成 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 在后台作品管理页新增 AI 生成作品能力，支持文生图和最多 3 张参考图的以图生图，并在人工审核后把生成图带入现有新增作品流程。

**Architecture:** 后端新增独立的火山引擎图片生成 provider 和管理接口，按官方教程调用 `Doubao-Seedream-5.0-lite`，把生成结果下载到本地 `uploads/ai/`。前端在 `AdminFlowers` 中新增独立 AI 生成对话框，只负责收集 prompt / 参考图、展示生成结果，并把图片注入现有作品新增抽屉，不新增独立草稿表。

**Tech Stack:** Spring Boot 3, MyBatis-Plus, Spring MVC Multipart, Java 17 HttpClient, React 19, Ant Design 6, lucide-react, Docker Compose

---

## File Structure

### Backend

- Modify: `flower-shop-backend-java/pom.xml`
  - 如需要，为后端增加缺失的 HTTP / multipart / JSON 辅助依赖；优先使用 JDK 17 自带 `HttpClient`，避免额外引依赖
- Modify: `flower-shop-backend-java/src/main/resources/application.yml`
  - 增加火山引擎配置、AI 限额配置、图片生成相关环境变量
- Create: `flower-shop-backend-java/src/main/java/com/floralwhisper/config/AiImageProperties.java`
  - 负责读取 AI 图片生成配置
- Create: `flower-shop-backend-java/src/main/java/com/floralwhisper/dto/AiImageGenerateResponse.java`
  - 返回给前端的生成结果
- Create: `flower-shop-backend-java/src/main/java/com/floralwhisper/service/ai/VolcengineImageGenerationService.java`
  - 封装火山引擎模型调用
- Create: `flower-shop-backend-java/src/main/java/com/floralwhisper/service/ai/AiGeneratedImageStorageService.java`
  - 负责把生成结果下载到 `uploads/ai/`
- Create: `flower-shop-backend-java/src/main/java/com/floralwhisper/controller/AdminAiController.java`
  - 新增管理员 AI 图片生成接口
- Modify: `flower-shop-backend-java/src/main/java/com/floralwhisper/config/SecurityConfig.java`
  - 允许管理员访问新增 AI 接口
- Modify: `flower-shop-backend-java/src/main/java/com/floralwhisper/common/GlobalExceptionHandler.java`
  - 如有必要，补充 AI 上传/调用错误的统一消息
- Test: `flower-shop-backend-java/src/test/java/com/floralwhisper/controller/AdminControllerTest.java`
  - 参考已有控制器测试模式，增加 AI 管理接口测试
- Create: `flower-shop-backend-java/src/test/java/com/floralwhisper/controller/AdminAiControllerTest.java`
  - 验证权限、参数校验、成功返回结构

### Frontend

- Modify: `flower-shop-web/src/services/api.ts`
  - 新增 AI 图片生成接口调用
- Modify: `flower-shop-web/src/pages/AdminFlowers/AdminFlowers.tsx`
  - 增加 AI 生成按钮、对话框、上传参考图、结果预览、导入现有新增作品表单
- Modify: `flower-shop-web/src/styles.css`
  - 如需要，为 AI 对话框和生成结果预览补充局部样式

### Docs

- Modify: `README.md`
  - 补充 AI 相关环境变量和功能说明
- Modify: `docs/api.md`
  - 补充新增 AI 管理接口

---

### Task 1: 增加后端 AI 配置与环境变量

**Files:**
- Modify: `flower-shop-backend-java/src/main/resources/application.yml`
- Create: `flower-shop-backend-java/src/main/java/com/floralwhisper/config/AiImageProperties.java`

- [ ] **Step 1: 写配置类的失败测试思路**

检查现有配置绑定模式，参考 `AppProperties` 的绑定方式，确认新增配置使用 `@ConfigurationProperties` 而不是手写 `System.getenv()`。

- [ ] **Step 2: 在 `application.yml` 中增加 AI 配置项**

增加如下配置段，保持默认值保守：

```yaml
app:
  ai-image:
    enabled: ${AI_IMAGE_ENABLED:false}
    provider: ${AI_IMAGE_PROVIDER:volcengine}
    api-key: ${VOLCENGINE_API_KEY:}
    model: ${VOLCENGINE_IMAGE_MODEL:Doubao-Seedream-5.0-lite}
    max-reference-files: ${AI_IMAGE_MAX_REFERENCE_FILES:3}
    max-reference-file-size-bytes: ${AI_IMAGE_MAX_REFERENCE_FILE_SIZE_BYTES:20971520}
    download-subdir: ${AI_IMAGE_DOWNLOAD_SUBDIR:ai}
    request-timeout-seconds: ${AI_IMAGE_REQUEST_TIMEOUT_SECONDS:120}
```

- [ ] **Step 3: 新增配置类**

创建 `AiImageProperties.java`，结构最小化：

```java
package com.floralwhisper.config;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;

@Data
@ConfigurationProperties(prefix = "app.ai-image")
public class AiImageProperties {
  private boolean enabled;
  private String provider;
  private String apiKey;
  private String model;
  private int maxReferenceFiles = 3;
  private long maxReferenceFileSizeBytes = 20L * 1024L * 1024L;
  private String downloadSubdir = "ai";
  private int requestTimeoutSeconds = 120;
}
```

- [ ] **Step 4: 将配置类纳入 Spring 管理**

如果现有 `@EnableConfigurationProperties` 已集中管理，按现有模式把 `AiImageProperties` 注册进去。

- [ ] **Step 5: 运行后端测试验证未破坏现有配置**

Run:

```bash
cd /workspace/FloralWhisperTime/flower-shop-backend-java
mvn test
```

Expected: 现有测试通过；如失败，先修复配置接入问题再继续。

- [ ] **Step 6: Commit**

```bash
git add flower-shop-backend-java/src/main/resources/application.yml flower-shop-backend-java/src/main/java/com/floralwhisper/config/AiImageProperties.java
git commit -m "feat: 增加AI图片生成配置"
```

### Task 2: 实现火山引擎图片生成 Provider

**Files:**
- Create: `flower-shop-backend-java/src/main/java/com/floralwhisper/service/ai/VolcengineImageGenerationService.java`
- Modify: `flower-shop-backend-java/pom.xml`（仅当确实缺依赖时）

- [ ] **Step 1: 先定义 provider 的最小职责**

这个服务只负责：

- 接收 prompt
- 接收 0-3 张参考图
- 按官方教程发请求
- 解析响应中的生成图片地址

不负责：

- controller 参数校验
- 本地文件保存
- 正式作品发布

- [ ] **Step 2: 实现 provider 接口**

创建服务类，优先使用 JDK 17 `HttpClient`：

```java
package com.floralwhisper.service.ai;

import com.floralwhisper.config.AiImageProperties;
import java.net.http.HttpClient;
import org.springframework.stereotype.Service;

@Service
public class VolcengineImageGenerationService {
  private final AiImageProperties properties;
  private final HttpClient httpClient;

  public VolcengineImageGenerationService(AiImageProperties properties) {
    this.properties = properties;
    this.httpClient = HttpClient.newBuilder().build();
  }
}
```

- [ ] **Step 3: 按官方教程实现请求组装**

按你提供的官方文档实现，不自行发明协议。实现中要求：

- 用配置中的模型名
- 带认证头
- 文生图和以图生图都走统一入口
- 参考图最多 3 张

如果官方教程需要 multipart，按 multipart 发；如果需要 JSON + image url/base64，按官方格式发。

- [ ] **Step 4: 解析响应并提取生成图片 URL**

只提取当前真正需要的最小结果：

- 生成模式
- 原始图片地址或可下载目标

如响应结构异常，抛出统一业务异常：

```java
throw new ApiException("AI 生成结果解析失败");
```

- [ ] **Step 5: 为 provider 补充最小单元测试或伪造响应解析测试**

如果直接 mock HTTP 成本太高，至少为“响应解析逻辑”拆出可测试方法，并覆盖：

- 文生图成功解析
- 以图生图成功解析
- 响应缺字段时报错

- [ ] **Step 6: 运行测试**

Run:

```bash
cd /workspace/FloralWhisperTime/flower-shop-backend-java
mvn test
```

Expected: provider 相关测试通过，旧测试不回归。

- [ ] **Step 7: Commit**

```bash
git add flower-shop-backend-java/src/main/java/com/floralwhisper/service/ai/VolcengineImageGenerationService.java flower-shop-backend-java/pom.xml
git commit -m "feat: 接入火山引擎图片生成服务"
```

### Task 3: 实现生成图下载到本地 uploads/ai

**Files:**
- Create: `flower-shop-backend-java/src/main/java/com/floralwhisper/service/ai/AiGeneratedImageStorageService.java`
- Modify: `flower-shop-backend-java/src/main/java/com/floralwhisper/storage/FileStorageService.java`（仅当复用其路径逻辑有价值）

- [ ] **Step 1: 定义下载服务职责**

该服务只负责：

- 接收生成图片 URL
- 下载图片
- 落地到 `uploads/ai/`
- 返回系统内部 URL

- [ ] **Step 2: 实现本地落地服务**

建议最小结构：

```java
package com.floralwhisper.service.ai;

import com.floralwhisper.config.AiImageProperties;
import com.floralwhisper.config.AppProperties;
import java.nio.file.Path;
import org.springframework.stereotype.Service;

@Service
public class AiGeneratedImageStorageService {
  public String downloadToLocal(String remoteImageUrl) {
    // 下载、写入、返回 /uploads/ai/xxx.png
  }
}
```

要求：

- 自动创建 `uploads/ai/`
- 文件名使用时间戳 + 随机串
- 根据响应头或 URL 后缀决定扩展名
- 下载失败时报统一业务异常

- [ ] **Step 3: 复用现有 uploads 返回规则**

返回值必须与当前系统兼容，例如：

```json
{ "url": "/uploads/ai/ai-xxx.png" }
```

不要返回本地磁盘路径。

- [ ] **Step 4: 为下载服务补测试**

至少覆盖：

- 下载成功后文件存在
- 下载失败时报错
- 返回 URL 以 `/uploads/ai/` 开头

- [ ] **Step 5: 运行测试**

Run:

```bash
cd /workspace/FloralWhisperTime/flower-shop-backend-java
mvn test
```

Expected: 下载服务测试通过。

- [ ] **Step 6: Commit**

```bash
git add flower-shop-backend-java/src/main/java/com/floralwhisper/service/ai/AiGeneratedImageStorageService.java flower-shop-backend-java/src/main/java/com/floralwhisper/storage/FileStorageService.java
git commit -m "feat: 保存AI生成图片到本地上传目录"
```

### Task 4: 新增管理员 AI 图片生成接口

**Files:**
- Create: `flower-shop-backend-java/src/main/java/com/floralwhisper/dto/AiImageGenerateResponse.java`
- Create: `flower-shop-backend-java/src/main/java/com/floralwhisper/controller/AdminAiController.java`
- Modify: `flower-shop-backend-java/src/main/java/com/floralwhisper/config/SecurityConfig.java`
- Create: `flower-shop-backend-java/src/test/java/com/floralwhisper/controller/AdminAiControllerTest.java`

- [ ] **Step 1: 先写控制器测试骨架**

测试覆盖：

- 未登录访问返回 401 和 `{ "message": "请先登录管理后台" }`
- prompt 为空返回 400
- 超过 3 张参考图返回 400
- 单张超过 20MB 返回 400
- 成功时返回 `success/imageUrl/source/mode`

- [ ] **Step 2: 新增响应 DTO**

```java
package com.floralwhisper.dto;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class AiImageGenerateResponse {
  private boolean success;
  private String imageUrl;
  private String source;
  private String mode;
}
```

- [ ] **Step 3: 实现控制器**

控制器建议最小结构：

```java
@RestController
@RequestMapping("/api/admin/ai")
public class AdminAiController {
  @PostMapping(value = "/images/generate", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
  public AiImageGenerateResponse generate(
      @RequestParam("prompt") String prompt,
      @RequestParam(value = "referenceFiles", required = false) List<MultipartFile> referenceFiles) {
    // 校验 -> 调 provider -> 下载到本地 -> 返回结果
  }
}
```

要求：

- prompt 去空格后不能为空
- `referenceFiles.size() <= 3`
- 每张文件大小 <= 20MB
- 成功时返回：

```json
{
  "success": true,
  "imageUrl": "/uploads/ai/xxx.png",
  "source": "Doubao-Seedream-5.0-lite",
  "mode": "text_to_image"
}
```

- [ ] **Step 4: 在安全配置中开放管理员访问**

只允许管理员访问新增接口：

- `/api/admin/ai/**`

- [ ] **Step 5: 跑控制器测试验证红绿**

Run:

```bash
cd /workspace/FloralWhisperTime/flower-shop-backend-java
mvn test
```

Expected: `AdminAiControllerTest` 通过，旧控制器测试不回归。

- [ ] **Step 6: Commit**

```bash
git add flower-shop-backend-java/src/main/java/com/floralwhisper/dto/AiImageGenerateResponse.java flower-shop-backend-java/src/main/java/com/floralwhisper/controller/AdminAiController.java flower-shop-backend-java/src/main/java/com/floralwhisper/config/SecurityConfig.java flower-shop-backend-java/src/test/java/com/floralwhisper/controller/AdminAiControllerTest.java
git commit -m "feat: 新增后台AI图片生成接口"
```

### Task 5: 前端增加 AI 生成对话框与接口调用

**Files:**
- Modify: `flower-shop-web/src/services/api.ts`
- Modify: `flower-shop-web/src/pages/AdminFlowers/AdminFlowers.tsx`
- Modify: `flower-shop-web/src/styles.css`

- [ ] **Step 1: 在前端 API 层增加调用方法**

在 `src/services/api.ts` 中新增：

```ts
export async function generateAdminAiImage(prompt: string, files: File[]) {
  const formData = new FormData();
  formData.append("prompt", prompt);
  files.forEach((file) => formData.append("referenceFiles", file));
  return request<{ success: boolean; imageUrl: string; source: string; mode: string }>("/api/admin/ai/images/generate", {
    method: "POST",
    body: formData,
  });
}
```

- [ ] **Step 2: 在 `AdminFlowers` 中增加 AI 生成入口状态**

新增状态：

- AI 对话框开关
- prompt 内容
- 参考图列表
- 生成中状态
- 生成结果对象

- [ ] **Step 3: 新增 AI 生成对话框 UI**

对话框至少包含：

- 大文本输入框
- 上传参考图区域
- 数量提示（最多 3 张）
- 大小提示（单张 20MB）
- 生成按钮
- 结果图预览
- `重新生成`
- `用于新建作品`

保持当前后台设计风格，不新增营销化视觉。

- [ ] **Step 4: 对接“用于新建作品”**

点击后执行：

- 把 `imageUrl` 写入当前新增作品表单的 `images`
- 打开现有新增作品抽屉
- 关闭 AI 对话框

不要额外创建第二套作品发布表单。

- [ ] **Step 5: 做前端最小交互校验**

- prompt 为空禁用生成
- 超过 3 张时前端直接拦截
- 超过 20MB 直接提示
- 失败时保留输入内容可重试

- [ ] **Step 6: 本地构建验证**

Run:

```bash
cd /workspace/FloralWhisperTime/flower-shop-web
npm run build
```

Expected: 构建通过，无 TS 报错。

- [ ] **Step 7: Commit**

```bash
git add flower-shop-web/src/services/api.ts flower-shop-web/src/pages/AdminFlowers/AdminFlowers.tsx flower-shop-web/src/styles.css
git commit -m "feat: 增加后台AI生成作品对话框"
```

### Task 6: 更新文档与部署说明

**Files:**
- Modify: `README.md`
- Modify: `docs/api.md`
- Modify: `docs/architecture.md`（如需要补一行 AI 模块）

- [ ] **Step 1: 更新 README**

补充：

- AI 相关环境变量
- AI 生成能力范围
- 本地图片落地路径

- [ ] **Step 2: 更新接口文档**

在 `docs/api.md` 中补充：

- `POST /api/admin/ai/images/generate`
- 入参说明
- 返回结构
- 参考图数量和大小限制

- [ ] **Step 3: 必要时更新架构文档**

如果文档已有 AI 描述空白，则补充后台 AI 生成模块位置和数据流。

- [ ] **Step 4: Commit**

```bash
git add README.md docs/api.md docs/architecture.md
git commit -m "docs: 补充后台AI生成作品说明"
```

### Task 7: Docker 联调与验收

**Files:**
- No source changes required unless defects are found during verification

- [ ] **Step 1: 配置环境变量**

在部署环境中设置：

```dotenv
AI_IMAGE_ENABLED=true
AI_IMAGE_PROVIDER=volcengine
VOLCENGINE_API_KEY=<new-key>
VOLCENGINE_IMAGE_MODEL=Doubao-Seedream-5.0-lite
AI_IMAGE_MAX_REFERENCE_FILES=3
AI_IMAGE_MAX_REFERENCE_FILE_SIZE_BYTES=20971520
AI_IMAGE_DOWNLOAD_SUBDIR=ai
AI_IMAGE_REQUEST_TIMEOUT_SECONDS=120
```

- [ ] **Step 2: 重建并启动容器**

Run:

```bash
cd /workspace/FloralWhisperTime
docker compose up -d --build
```

Expected: `mysql` healthy, `backend` healthy, `web` running。

- [ ] **Step 3: 后端健康检查**

Run:

```bash
curl -fsS http://127.0.0.1:8081/api/health
```

Expected:

```json
{"service":"flower-shop-backend-java","ok":true}
```

- [ ] **Step 4: 手工验收 AI 生成流程**

在后台执行：

1. 打开 `作品管理`
2. 点击 `AI生成作品`
3. 输入 prompt
4. 分别测试：
   - 文生图
   - 1 张参考图
   - 3 张参考图
5. 确认结果图能预览
6. 点击 `用于新建作品`
7. 确认新增作品抽屉自动带入生成图
8. 正式保存作品

- [ ] **Step 5: 验证图片本地落地**

Run:

```bash
find /workspace/FloralWhisperTime/flower-shop-backend-java/uploads/ai -maxdepth 1 -type f | tail
```

Expected: 能看到新生成图片文件。

- [ ] **Step 6: 验证公网访问路径**

Run:

```bash
curl -I http://127.0.0.1:8081/uploads/ai/<generated-file-name>
```

Expected: `200 OK`

- [ ] **Step 7: 如联调过程产生必要修复，单独提交**

```bash
git add <fixed-files>
git commit -m "fix: 修正后台AI生成作品联调问题"
```

---

## Self-Review

- 规格覆盖：
  - 已覆盖自由 prompt、多图参考、20MB 限制、单次 1 张、人工审核发布、本地下载、AdminFlowers 接入
- 占位符扫描：
  - 没有留 `TBD/TODO`
- 类型一致性：
  - 前端返回结构、后端响应 DTO、接口路径、上传字段名已统一为 `referenceFiles`

## Execution Handoff

Plan complete and saved to `docs/superpowers/plans/2026-05-14-admin-ai-flower-generation.md`. Two execution options:

**1. Subagent-Driven (recommended)** - I dispatch a fresh subagent per task, review between tasks, fast iteration

**2. Inline Execution** - Execute tasks in this session using executing-plans, batch execution with checkpoints

Which approach?
