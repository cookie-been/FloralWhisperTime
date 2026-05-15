# 花语时光接口文档

## 1. 接口概览

当前默认 API 服务由 `flower-shop-backend-java` 提供，统一前缀为：

```text
/api
```

开发默认地址：

```text
http://localhost:3001
```

Docker 部署时，浏览器通常直接通过 Web 服务同源访问：

```text
http://localhost:<实际WEB端口>/api
```

说明：

- 默认通常为 `8080`
- 如果部署时修改了 `WEB_PORT`，或当前环境存在端口占用，以部署脚本输出的 `Site URL` 为准

## 2. 认证机制

### 2.1 登录

管理员通过：

```http
POST /api/admin/login
```

获得 Bearer Token。

### 2.2 鉴权头

受保护接口需要：

```http
Authorization: Bearer <token>
```

## 3. 通用返回规则

### 3.1 成功

- 普通查询接口返回 JSON 对象或数组
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

返回：

```json
[
  {
    "id": "wedding",
    "name": "婚礼花艺",
    "icon": "Flower2",
    "description": "婚礼与宴会花艺",
    "sort": 1
  }
]
```

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

返回结构：

```json
{
  "list": [],
  "total": 72,
  "page": 1,
  "limit": 12
}
```

作品对象字段：

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

- 前端首页、后台总览、作品管理等需要统计全部作品的页面，应按分页聚合全部作品数据，不应只取前 200/500 条

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

返回首页和站点文案配置。

核心字段：

- `brandName`
- `heroEyebrow`
- `heroTitle`
- `heroDescription`
- `heroImage`
- `primaryCtaText`
- `secondaryCtaText`
- `contactIntro`
- `businessHoursText`
- `footerDescription`

说明：

- 公开 `GET /api/site-config` 不再返回 AI 配置
- AI 配置仅允许管理员通过后台专用接口读取和修改

### 4.7 门店信息

#### `GET /api/shop-info`

返回：

- 门店名称
- 电话
- 微信
- 地址
- 经纬度
- 每周营业时间

### 4.8 品牌故事

#### `GET /api/brand-story`

返回：

- `title`
- `subtitle`
- `content`
- `images`

### 4.9 关于我们页内容

#### `GET /api/about-page`

返回：

- `heroImage`
- `heroEyebrow`
- `heroTitle`
- `heroSubtitle`
- `storyTitle`
- `storyContent`

### 4.10 关于我们时间轴

#### `GET /api/about-timeline`

返回数组，每项包含：

- `id`
- `yearLabel`
- `content`
- `sort`

### 4.11 团队成员

#### `GET /api/team`

返回数组，每项包含：

- `id`
- `name`
- `title`
- `avatar`
- `bio`
- `sort`

### 4.12 提交留言

#### `POST /api/contact`

请求体：

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

- 当前控制器中接口路径是公开的
- 实际部署中后台页面按管理员流程使用该接口

成功返回：

```json
{
  "url": "/uploads/xxx.jpg"
}
```

## 5. 管理员接口

## 5.1 登录

#### `POST /api/admin/login`

请求体：

```json
{
  "username": "admin",
  "password": "Floral@2026"
}
```

返回：

```json
{
  "token": "xxxxx",
  "username": "admin"
}
```

## 5.2 当前管理员

#### `GET /api/admin/me`

返回：

```json
{
  "username": "admin"
}
```

## 5.3 系统状态

#### `GET /api/admin/system/status`

说明：

- 仅管理员可访问
- 返回当前运行实例的只读状态信息
- 适用于部署验收、运维巡检和售后排障

返回示例：

```json
{
  "service": "flower-shop-backend-java",
  "version": "1.0.0",
  "databaseConnected": true,
  "databaseVersion": "8.0.36",
  "databaseSize": "128.50 MB",
  "diskTotal": "500.00 GB",
  "diskUsable": "320.00 GB",
  "diskUsageRate": "36.00%",
  "uploadDirectoryReady": true,
  "uploadDirectoryPath": "/app/uploads",
  "uploadFileCount": 7,
  "uploadDirectorySize": "245.60 MB",
  "uptimeLabel": "3小时12分钟",
  "aiEnabled": true,
  "aiKeyConfigured": true,
  "aiProvider": "volcengine",
  "aiImageModel": "doubao-seedream-5-0-260128",
  "aiTextModel": "doubao-1-5-pro-32k-250115",
  "latestBackupName": "20260515-002808",
  "latestBackupPath": "/app/backups/20260515-002808",
  "latestBackupModifiedAt": "2026-05-15 08:28:08",
  "latestBackupDownloadUrl": "/api/admin/system/backups/latest/download",
  "latestBackupPresent": true
}
```

字段说明：

- `service`：服务底层标识，前端系统状态页会转成可读服务名称展示
- `version`：当前部署版本
- `databaseConnected`：数据库探测结果
- `databaseVersion`：当前数据库版本
- `databaseSize`：当前业务库估算容量
- `diskTotal`：当前挂载磁盘总容量
- `diskUsable`：当前挂载磁盘可用容量
- `diskUsageRate`：当前挂载磁盘已用比例
- `uploadDirectoryReady`：上传目录是否存在且可写
- `uploadDirectoryPath`：上传目录绝对路径
- `uploadFileCount`：上传目录文件总数
- `uploadDirectorySize`：上传目录累计容量
- `uptimeLabel`：当前服务运行时长
- `aiEnabled`：AI 图片能力是否启用
- `aiKeyConfigured`：AI 密钥是否已配置
- `aiProvider`：AI 提供商
- `aiImageModel`：图片模型
- `aiTextModel`：文本建议模型
- `latestBackupName`：最近备份目录名
- `latestBackupPath`：最近备份目录绝对路径
- `latestBackupModifiedAt`：最近备份目录最后更新时间
- `latestBackupDownloadUrl`：最近备份下载接口地址
- `latestBackupPresent`：是否发现备份目录
## 5.4 配置导出

#### `GET /api/admin/system/config-export`

说明：

- 仅管理员可访问
- 下载当前动态配置导出包，格式为 JSON 文件
- 适用于交付迁移、测试环境回填、售后恢复前留档

导出范围包括：

- 站点配置
- 门店信息与营业时间
- 品牌故事
- About 页首图/标题/副标题/正文
- About 时间轴
- 团队成员
- AI 配置

不包含：

- 作品数据
- 用户留言
- 操作日志

## 5.5 配置导入

#### `POST /api/admin/system/config-import`

请求方式：

- `multipart/form-data`
- 字段名：`file`

返回示例：

```json
{
  "version": "1.0.0",
  "importedAt": "2026-05-15 16:20:30",
  "timelineCount": 3,
  "teamCount": 2,
  "includedAiSettings": true
}
```

说明：

- 会覆盖当前动态配置内容
- 不会修改作品、留言和操作日志数据
- 正式环境建议导入前先下载最近备份，再执行导入

## 5.6 后台站点配置

#### `GET /api/admin/site-config`

管理员读取完整站点配置，用于维护首页首屏、门店信息、品牌故事、关于我们和后台展示文案等动态内容。

#### `GET /api/admin/system/backups/latest/download`

说明：

- 仅管理员可访问
- 动态将最近一份备份目录打包为 `tar.gz` 并直接下载
- 无需先在服务器额外生成临时归档文件

成功响应头示例：

```text
Content-Type: application/gzip
Content-Disposition: attachment; filename="latest-backup.tar.gz"
```

## 5.4 AI 配置

#### `GET /api/admin/system/ai-settings`

返回脱敏后的 AI 配置：

- `apiKey` 不会返回
- 使用 `apiKeyConfigured` 表示是否已配置
- 使用 `apiKeyMasked` 展示脱敏摘要

#### `PUT /api/admin/system/ai-settings`

更新后台 AI 配置。空字符串不会覆盖已有密钥。

## 5.5 用户留言列表

#### `GET /api/admin/contacts`

查询参数：

- `page`
- `limit`
- `keyword`
- `status`

其中 `status` 支持：

- `all`
- `read`
- `unread`

返回：

```json
{
  "list": [],
  "total": 10,
  "page": 1,
  "limit": 10
}
```

说明：

- 后台列表页默认展示面向运营的访客信息和提交时间
- 记录标识仍保留在详情页中，便于后台追踪

## 5.6 标记留言已读

#### `PATCH /api/admin/contacts/{id}/read`

返回更新后的留言对象。

## 5.7 AI 生成作品图

#### `POST /api/admin/ai/images/generate`

请求类型：

- `multipart/form-data`

请求字段：

- `prompt`: string，必填
- `referenceFiles`: file[]，可选，最多 3 张

约束：

- prompt 不能为空
- 参考图最多 3 张
- 单张参考图最大 20MB
- 仅支持图片文件

成功返回：

```json
{
  "success": true,
  "imageUrl": "/uploads/ai/ai-1747220000000-xxxx.png",
  "source": "Doubao-Seedream-5.0-lite",
  "mode": "text_to_image"
}
```

或：

```json
{
  "success": true,
  "imageUrl": "/uploads/ai/ai-1747220000000-xxxx.png",
  "source": "Doubao-Seedream-5.0-lite",
  "mode": "image_to_image"
}
```

## 5.6 AI 作品信息建议

#### `POST /api/admin/ai/flowers/suggestions`

请求体：

```json
{
  "prompt": "生成一束白绿色婚礼花束",
  "imageUrl": "/uploads/ai/ai-1747220000000-xxxx.png",
  "mode": "text_to_image"
}
```

成功返回：

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

- `prompt` 必填
- 该接口只返回建议内容，不会自动创建作品
- 返回的 `categoryId` 会被服务端限制在现有分类内
- 建议失败时不影响继续使用图片

## 5.7 创建作品

#### `POST /api/flowers`

请求体示例：

```json
{
  "id": "wedding-001",
  "name": "白绿婚礼手捧",
  "categoryId": "wedding",
  "images": ["/catalog/wedding/wedding-001-a.svg"],
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

说明：

- `name` 必填
- `categoryId` 必填
- `id` 可传，也可由服务端生成

## 5.8 更新作品

#### `PUT /api/flowers/{id}`

请求体与创建作品相同。

## 5.9 删除作品

#### `DELETE /api/flowers/{id}`

成功返回：

```http
204 No Content
```

## 5.10 获取后台 AI 配置

#### `GET /api/admin/system/ai-settings`

需要管理员 Bearer Token。

成功返回：

```json
{
  "enabled": true,
  "provider": "volcengine",
  "apiKeyConfigured": true,
  "apiKeyMasked": "3798ed26-****-****-****-f183",
  "model": "doubao-seedream-5-0-260128",
  "baseUrl": "https://ark.cn-beijing.volces.com/api/v3",
  "generatePath": "/images/generations",
  "size": "1920x1920",
  "textModel": "doubao-1-5-pro-32k-250115",
  "textGeneratePath": "/chat/completions",
  "textTemperature": 0.4,
  "textMaxTokens": 1200
}
```

说明：

- 不返回明文 `apiKey`
- `apiKeyConfigured` 表示当前是否已配置密钥
- `apiKeyMasked` 为脱敏展示值

## 5.11 更新后台 AI 配置

#### `PUT /api/admin/system/ai-settings`

需要管理员 Bearer Token。

请求体示例：

```json
{
  "enabled": true,
  "provider": "volcengine",
  "apiKey": "new-secret-key",
  "model": "doubao-seedream-5-0-260128",
  "baseUrl": "https://ark.cn-beijing.volces.com/api/v3",
  "generatePath": "/images/generations",
  "size": "1920x1920",
  "textModel": "doubao-1-5-pro-32k-250115",
  "textGeneratePath": "/chat/completions",
  "textTemperature": 0.4,
  "textMaxTokens": 1200
}
```

说明：

- `apiKey` 留空或不传时，不会覆盖旧密钥
- 成功响应返回脱敏后的 AI 配置

## 5.12 更新站点配置

#### `PUT /api/site-config`

这个接口用于统一更新首页、门店和品牌故事相关内容。

核心可写字段：

- `brandName`
- `heroEyebrow`
- `heroTitle`
- `heroDescription`
- `heroImage`
- `primaryCtaText`
- `secondaryCtaText`
- `contactIntro`
- `businessHoursText`
- `footerDescription`
- `phone`
- `wechat`
- `address`
- `latitude`
- `longitude`
- `storyTitle`
- `storySubtitle`
- `storyContent`
- `storyImages`

## 5.13 获取关于我们页配置

#### `GET /api/admin/about-page`

返回关于我们页可编辑内容。

## 5.14 更新关于我们页配置

#### `PUT /api/admin/about-page`

请求体：

```json
{
  "heroImage": "/uploads/about-hero.jpg",
  "heroEyebrow": "About Floral Whisper",
  "heroTitle": "关于我们",
  "heroSubtitle": "用花表达空间与情绪",
  "storyTitle": "品牌故事",
  "storyContent": "......"
}
```

## 5.15 获取关于我们时间轴

#### `GET /api/admin/about-timeline`

返回时间轴数组。

## 5.16 新增时间轴条目

#### `POST /api/admin/about-timeline`

请求体：

```json
{
  "id": "timeline-2024",
  "yearLabel": "2024",
  "content": "完成品牌空间升级",
  "sort": 10
}
```

## 5.17 更新时间轴条目

#### `PUT /api/admin/about-timeline/{id}`

请求体与新增相同。

## 5.18 删除时间轴条目

#### `DELETE /api/admin/about-timeline/{id}`

成功返回：

```http
204 No Content
```

## 5.16 获取团队成员

#### `GET /api/admin/team`

返回团队成员数组。

## 5.17 新增团队成员

#### `POST /api/admin/team`

请求体：

```json
{
  "id": "team-001",
  "name": "林青",
  "title": "主理花艺师",
  "avatar": "/uploads/team-001.jpg",
  "bio": "负责婚礼与品牌空间花艺",
  "sort": 10
}
```

## 5.18 更新团队成员

#### `PUT /api/admin/team/{id}`

请求体与新增相同。

## 5.19 删除团队成员

#### `DELETE /api/admin/team/{id}`

成功返回：

```http
204 No Content
```

## 6. 状态码约定

常见状态码：

- `200 OK`：查询或更新成功
- `201 Created`：创建成功
- `204 No Content`：删除成功
- `400 Bad Request`：参数错误
- `401 Unauthorized`：未登录或 token 无效
- `403 Forbidden`：无权限
- `404 Not Found`：资源不存在
- `500 Internal Server Error`：服务端异常

## 7. 调试方式

开发环境可直接访问 Swagger：

```text
http://localhost:3001/swagger-ui.html
```

部署环境下，如容器未对后端单独暴露端口，通常通过 Web 统一入口访问业务接口。
