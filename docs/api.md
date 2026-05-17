# 花语时光接口文档

## 1. 接口概览

当前默认 API 服务由 `flower-shop-backend-java` 提供，统一前缀为：

```text
/api
```

本地开发默认地址：

```text
http://localhost:3001
```

Docker 部署时，浏览器通常通过 Web 服务同源访问：

```text
http://localhost:<WEB_PORT>/api
```

## 2. 认证机制

### 2.1 登录

管理员通过：

```http
POST /api/admin/login
```

获取 JWT Bearer Token。

### 2.2 鉴权头

受保护接口需要：

```http
Authorization: Bearer <token>
```

### 2.3 首次交付安全约束

登录成功后响应中会返回 `requirePasswordChange`，用于提示是否必须先修改管理员密码。

改密接口：

```http
POST /api/admin/change-password
```

## 3. 通用返回规则

### 3.1 成功

- 查询接口返回 JSON 对象或数组
- 创建接口通常返回 `201 Created`
- 删除接口通常返回 `204 No Content`

### 3.2 失败

错误统一格式：

```json
{ "message": "错误说明" }
```

## 4. 公开接口

### 4.1 健康检查

#### `GET /api/health`

返回示例：

```json
{
  "ok": true,
  "service": "flower-shop-backend-java"
}
```

### 4.2 分类列表

#### `GET /api/categories`

返回数组，字段通常包括：

- `id`
- `name`
- `icon`
- `description`
- `sort`

### 4.3 作品列表

#### `GET /api/flowers`

查询参数：

- `categoryId`
- `tag`
- `keyword`
- `sortBy`
- `page`
- `limit`

`sortBy` 支持：

- `featured`
- `latest`
- `price_asc`
- `price_desc`

返回示例：

```json
{
  "list": [],
  "total": 72,
  "page": 1,
  "limit": 12
}
```

作品对象字段通常包括：

- `id`
- `name`
- `categoryId`
- `images`
- `price`
- `description`
- `materials`
- `meaning`
- `tags`
- `featured`
- `sort`
- `createdAt`

说明：

- 公开列表默认只返回未删除作品
- 前台与后台汇总统计时，应按分页聚合全部结果，不应只抓取单页

### 4.4 作品详情

#### `GET /api/flowers/{id}`

返回单个作品对象。

### 4.5 相关推荐

#### `GET /api/flowers/{id}/related`

查询参数：

- `limit`

返回作品数组。

### 4.6 站点配置

#### `GET /api/site-config`

返回公开站点配置。

常见字段包括：

- `brandName`
- `heroEyebrow`
- `heroTitle`
- `heroDescription`
- `heroImage`
- `brandLogo`
- `heroSlides`
- `adminLoginSlides`
- `contactImages`
- `primaryCtaText`
- `secondaryCtaText`
- `footerDescription`
- `galleryPageTitle`
- `gallerySearchPlaceholder`

说明：

- 公开站点配置不返回 AI 密钥等敏感配置

### 4.7 门店信息

#### `GET /api/shop-info`

返回字段通常包括：

- 门店名称
- 电话
- 微信
- 地址
- 经纬度
- 营业时间

### 4.8 品牌故事

#### `GET /api/brand-story`

返回字段通常包括：

- `title`
- `subtitle`
- `content`
- `images`

### 4.9 关于我们页内容

#### `GET /api/about-page`

返回字段通常包括：

- `heroImage`
- `heroEyebrow`
- `heroTitle`
- `heroSubtitle`
- `storyTitle`
- `storyContent`

### 4.10 关于我们时间轴

#### `GET /api/about-timeline`

返回数组，每项通常包括：

- `id`
- `yearLabel`
- `content`
- `sort`

说明：

- 公开接口默认不返回已删除条目

### 4.11 团队成员

#### `GET /api/team`

返回数组，每项通常包括：

- `id`
- `name`
- `title`
- `avatar`
- `bio`
- `sort`

说明：

- 公开接口默认只展示当前有效成员

### 4.12 提交留言

#### `POST /api/contact`

请求体示例：

```json
{
  "name": "张三",
  "phone": "13800000000",
  "message": "想预约开业花篮"
}
```

成功返回：

```json
{
  "success": true
}
```

### 4.13 上传文件

#### `POST /api/uploads`

请求方式：

- `multipart/form-data`
- 字段名：`file`

说明：

- 控制器路径位于公开路由下
- 但实际写权限受 Spring Security 保护，当前要求管理员登录
- 单文件大小上限为 `20MB`

成功返回示例：

```json
{
  "url": "/uploads/xxx.jpg"
}
```

## 5. 管理员接口

### 5.1 登录

#### `POST /api/admin/login`

请求体示例：

```json
{
  "username": "admin",
  "password": "Floral@2026"
}
```

返回示例：

```json
{
  "token": "xxxxx",
  "username": "admin",
  "requirePasswordChange": true
}
```

### 5.2 当前管理员

#### `GET /api/admin/me`

返回示例：

```json
{
  "username": "admin",
  "requirePasswordChange": false,
  "passwordChangedAt": "2026-05-17 10:30:22"
}
```

### 5.3 修改管理员密码

#### `POST /api/admin/change-password`

请求体示例：

```json
{
  "currentPassword": "Floral@2026",
  "newPassword": "Floral@2026#New"
}
```

返回示例：

```json
{
  "username": "admin",
  "requirePasswordChange": false,
  "changedAt": "2026-05-17 10:35:10"
}
```

### 5.4 系统状态

#### `GET /api/admin/system/status`

说明：

- 仅管理员可访问
- 用于部署验收、巡检、排障和售后支持

返回字段通常包括：

- `service`
- `version`
- `databaseConnected`
- `databaseVersion`
- `databaseSize`
- `diskTotal`
- `diskUsable`
- `diskUsageRate`
- `uploadDirectoryReady`
- `uploadDirectoryPath`
- `uploadFileCount`
- `uploadDirectorySize`
- `uptimeLabel`
- `aiEnabled`
- `aiKeyConfigured`
- `aiProvider`
- `aiImageModel`
- `aiTextModel`
- `latestBackupName`
- `latestBackupPath`
- `latestBackupModifiedAt`
- `latestBackupDownloadUrl`
- `latestBackupPresent`
- `requirePasswordChange`
- `deliveryInitialized`
- `security`
- `protection`

### 5.5 运维任务列表

#### `GET /api/admin/system/ops-tasks`

返回最近后台触发的备份、巡检等任务记录。

### 5.6 备份列表

#### `GET /api/admin/system/backups`

返回当前备份目录列表。

### 5.7 创建备份任务

#### `POST /api/admin/system/ops-tasks/backup`

返回新建的备份任务对象。

### 5.8 创建巡检任务

#### `POST /api/admin/system/ops-tasks/inspection`

返回新建的巡检任务对象。

### 5.9 下载最近备份

#### `GET /api/admin/system/backups/latest/download`

响应类型：

```text
application/gzip
```

### 5.10 下载指定备份

#### `GET /api/admin/system/backups/{backupName}/download`

响应类型：

```text
application/gzip
```

### 5.11 配置导出

#### `GET /api/admin/system/config-export`

说明：

- 导出当前动态配置 JSON
- 适用于交付、迁移和售后恢复前留档

导出范围包括：

- 站点配置
- 门店信息与营业时间
- 品牌故事
- About 页面
- About 时间轴
- 团队成员
- AI 配置

不包含：

- 作品数据
- 用户留言
- 操作日志

### 5.12 配置导入

#### `POST /api/admin/system/config-import`

请求方式：

- `multipart/form-data`
- 字段名：`file`

说明：

- 会覆盖当前动态配置
- 不修改作品、留言和操作日志数据
- 受高成本接口并发隔离保护

### 5.13 操作日志归档

#### `POST /api/admin/system/operation-logs/archive`

查询参数：

- `before`，ISO 时间格式

### 5.14 操作日志归档文件列表

#### `GET /api/admin/system/operation-logs/archive-files`

返回已归档的日志文件列表。

### 5.15 下载操作日志归档

#### `GET /api/admin/system/operation-logs/archive-files/{filename}/download`

响应类型：

```text
text/csv;charset=UTF-8
```

### 5.16 AI 配置读取

#### `GET /api/admin/system/ai-settings`

返回脱敏后的 AI 配置。

常见字段包括：

- `enabled`
- `provider`
- `apiKeyConfigured`
- `apiKeyMasked`
- `model`
- `baseUrl`
- `generatePath`
- `size`
- `textModel`
- `textGeneratePath`
- `textTemperature`
- `textMaxTokens`

### 5.17 AI 配置更新

#### `PUT /api/admin/system/ai-settings`

请求体可包含：

- `enabled`
- `provider`
- `apiKey`
- `model`
- `baseUrl`
- `generatePath`
- `size`
- `textModel`
- `textGeneratePath`
- `textTemperature`
- `textMaxTokens`

说明：

- `apiKey` 留空时不覆盖原有密钥
- 返回值仍为脱敏配置

### 5.18 读取后台完整站点配置

#### `GET /api/admin/site-config`

返回后台维护所需的完整站点配置。

### 5.19 留言列表

#### `GET /api/admin/contacts`

查询参数：

- `page`
- `limit`
- `keyword`
- `status`
- `deleted`

其中：

- `status` 支持 `all` / `read` / `unread`
- `deleted` 支持 `active` / `deleted` / `all`

### 5.20 标记留言已读

#### `PATCH /api/admin/contacts/{id}/read`

返回更新后的留言对象。

### 5.21 删除留言

#### `DELETE /api/admin/contacts/{id}`

当前为逻辑删除，成功返回：

```http
204 No Content
```

### 5.22 恢复留言

#### `POST /api/admin/contacts/{id}/restore`

返回恢复后的留言对象。

### 5.23 后台作品列表

#### `GET /api/admin/flowers`

查询参数：

- `categoryId`
- `tag`
- `keyword`
- `sortBy`
- `page`
- `limit`
- `deleted`

其中 `deleted` 支持：

- `active`
- `deleted`
- `all`

返回中的作品对象包含：

- 常规作品字段
- `deleted`

### 5.24 恢复作品

#### `POST /api/admin/flowers/{id}/restore`

返回恢复后的作品对象。

### 5.25 操作日志列表

#### `GET /api/admin/operation-logs`

查询参数：

- `page`
- `limit`
- `module`
- `action`
- `operatorName`
- `success`
- `keyword`
- `restorable`
- `createdFrom`
- `createdTo`

### 5.26 导出操作日志

#### `GET /api/admin/operation-logs/export`

响应类型：

```text
text/csv;charset=UTF-8
```

### 5.27 操作日志详情

#### `GET /api/admin/operation-logs/{id}`

返回字段通常包括：

- 基础日志字段
- 请求摘要
- 前后快照
- 恢复来源链路
- 字段差异

### 5.28 按日志恢复

#### `POST /api/admin/operation-logs/{id}/restore`

请求体示例：

```json
{
  "reason": "恢复误操作"
}
```

### 5.29 读取关于我们页配置

#### `GET /api/admin/about-page`

返回后台可编辑的 About 页面内容。

### 5.30 更新关于我们页配置

#### `PUT /api/admin/about-page`

请求体可包含：

- `heroImage`
- `heroEyebrow`
- `heroTitle`
- `heroSubtitle`
- `storyTitle`
- `storyContent`

### 5.31 获取时间轴

#### `GET /api/admin/about-timeline`

查询参数：

- `deleted`

支持：

- `active`
- `deleted`
- `all`

返回条目包含：

- `id`
- `yearLabel`
- `content`
- `sort`
- `deleted`

### 5.32 新增时间轴条目

#### `POST /api/admin/about-timeline`

### 5.33 更新时间轴条目

#### `PUT /api/admin/about-timeline/{id}`

### 5.34 删除时间轴条目

#### `DELETE /api/admin/about-timeline/{id}`

当前为逻辑删除。

### 5.35 恢复时间轴条目

#### `POST /api/admin/about-timeline/{id}/restore`

### 5.36 获取团队成员

#### `GET /api/admin/team`

查询参数：

- `deleted`

支持：

- `active`
- `deleted`
- `all`

### 5.37 新增团队成员

#### `POST /api/admin/team`

### 5.38 更新团队成员

#### `PUT /api/admin/team/{id}`

### 5.39 删除团队成员

#### `DELETE /api/admin/team/{id}`

当前为逻辑删除。

### 5.40 恢复团队成员

#### `POST /api/admin/team/{id}/restore`

## 6. AI 接口

### 6.1 AI 生图

#### `POST /api/admin/ai/images/generate`

请求方式：

- `multipart/form-data`

请求字段：

- `prompt`：必填
- `referenceFiles`：可选，多文件

约束：

- 每次生成 1 张图
- 最多 3 张参考图
- 单张参考图最大 20MB
- 仅支持图片文件

成功返回示例：

```json
{
  "success": true,
  "imageUrl": "/uploads/ai/ai-1747220000000-xxxx.png",
  "source": "doubao-seedream-5-0-260128",
  "mode": "text_to_image"
}
```

或：

```json
{
  "success": true,
  "imageUrl": "/uploads/ai/ai-1747220000000-xxxx.png",
  "source": "doubao-seedream-5-0-260128",
  "mode": "image_to_image"
}
```

说明：

- 服务端会将第三方返回的图片下载到本地 `uploads/ai/`
- 接口受高成本并发隔离保护

### 6.2 AI 作品信息建议

#### `POST /api/admin/ai/flowers/suggestions`

请求体示例：

```json
{
  "prompt": "生成一束白绿色婚礼花束",
  "imageUrl": "/uploads/ai/ai-1747220000000-xxxx.png",
  "mode": "text_to_image"
}
```

返回示例：

```json
{
  "name": "晨雾誓约",
  "categoryId": "wedding",
  "description": "以奶油白玫瑰和轻盈绿植构成干净克制的婚礼手捧花。",
  "materials": ["白玫瑰", "洋牡丹", "尤加利"],
  "tags": ["婚礼", "白绿色", "现代感"],
  "meaning": "象征纯净承诺与温柔陪伴"
}
```

说明：

- 该接口只返回建议内容
- 不会自动创建作品
- `categoryId` 会被限制在系统现有分类内

## 7. 作品写接口

### 7.1 创建作品

#### `POST /api/flowers`

说明：

- 路径位于公开资源控制器中
- 实际写权限要求管理员身份

请求体示例：

```json
{
  "id": "wedding-001",
  "name": "白绿婚礼手捧",
  "categoryId": "wedding",
  "images": ["/uploads/demo.jpg"],
  "price": 599,
  "description": "适合轻仪式感婚礼场景",
  "materials": ["白玫瑰", "尤加利"],
  "meaning": "纯净与陪伴",
  "tags": ["婚礼", "白绿"],
  "featured": true,
  "sort": 10,
  "createdAt": "2026-05-14T00:00:00.000Z"
}
```

### 7.2 更新作品

#### `PUT /api/flowers/{id}`

请求体结构与创建一致。

### 7.3 删除作品

#### `DELETE /api/flowers/{id}`

说明：

- 当前删除行为为逻辑删除

## 8. 配置写接口

### 8.1 更新站点配置

#### `PUT /api/site-config`

说明：

- 路径位于站点控制器
- 实际写权限要求管理员身份

可写字段覆盖首页、门店、品牌故事、About、后台文案和媒体资源相关内容。
