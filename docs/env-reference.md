# 生产环境变量说明

本文档说明部署和运维时最常用的环境变量，推荐配合 `.env.production.example` 使用。

## 站点与发布

| 变量 | 说明 | 建议 |
|------|------|------|
| `WEB_PORT` | Web 容器对外暴露端口 | 按服务器端口规划设置 |
| `APP_ENVIRONMENT` | 当前环境标识 | 生产环境设为 `production` |
| `APP_GIT_REVISION` | 当前部署对应的 git 提交号 | 部署时写入短 SHA |
| `APP_DEPLOYED_AT` | 当前部署完成时间 | 使用 ISO 8601 时间字符串 |

## 数据库

| 变量 | 说明 | 建议 |
|------|------|------|
| `MYSQL_DATABASE` | 业务数据库名 | 保持固定 |
| `MYSQL_USER` | 业务数据库用户 | 独立低权限用户 |
| `MYSQL_PASSWORD` | 业务数据库密码 | 使用强密码 |
| `MYSQL_ROOT_PASSWORD` | MySQL root 密码 | 使用强密码并妥善保管 |

## 管理后台与认证

| 变量 | 说明 | 建议 |
|------|------|------|
| `ADMIN_USERNAME` | 后台管理员账号 | 生产环境可改为非默认账号 |
| `ADMIN_PASSWORD` | 后台管理员密码 | 使用强密码 |
| `ADMIN_AUTH_SECRET` | JWT/HMAC 签名密钥 | 至少 32 位随机字符串 |
| `JWT_ISSUER` | JWT 签发者标识 | 一般保持默认 |

## 跨域与备份

| 变量 | 说明 | 建议 |
|------|------|------|
| `CORS_ALLOWED_ORIGIN_PATTERNS` | 允许访问的来源域名 | 只填正式域名 |
| `BACKUP_DIR` | 容器内备份目录 | 与持久化路径保持一致 |

## AI 生图

| 变量 | 说明 | 建议 |
|------|------|------|
| `AI_IMAGE_ENABLED` | 是否启用 AI 生图 | 未开通时设为 `false` |
| `AI_IMAGE_PROVIDER` | AI 提供商 | 当前使用 `volcengine` |
| `VOLCENGINE_API_KEY` | 火山引擎 API Key | 正式密钥 |
| `VOLCENGINE_IMAGE_MODEL` | 生图模型 ID | 与后台配置保持一致 |
| `VOLCENGINE_BASE_URL` | 接口基础地址 | 一般保持默认 |
| `VOLCENGINE_IMAGE_GENERATE_PATH` | 生图接口路径 | 一般保持默认 |
| `AI_IMAGE_MAX_REFERENCE_FILES` | 参考图数量上限 | 默认 `3` |
| `AI_IMAGE_MAX_REFERENCE_FILE_SIZE_BYTES` | 单张参考图大小上限 | 默认 `20971520` |
| `AI_IMAGE_DOWNLOAD_SUBDIR` | AI 生成图下载子目录 | 默认 `ai` |
| `AI_IMAGE_REQUEST_TIMEOUT_SECONDS` | 请求超时时间 | 默认 `120` |
| `AI_IMAGE_SIZE` | 图片生成尺寸 | 按业务画幅设置 |
| `AI_IMAGE_RESPONSE_FORMAT` | 返回格式 | 默认 `url` |
| `AI_IMAGE_WATERMARK` | 是否添加水印 | 按业务要求设置 |

## 并发保护与缓存

| 变量 | 说明 | 建议 |
|------|------|------|
| `PROTECTION_PUBLIC_READ_ENABLED` | 是否启用公开读取限流 | 生产环境保持 `true` |
| `PROTECTION_PUBLIC_READ_CAPACITY` | 公开读取周期令牌数 | 按站点访问量预估设置 |
| `PROTECTION_PUBLIC_READ_REFILL_SECONDS` | 公开读取令牌恢复周期 | 默认 `10` 秒 |
| `PROTECTION_PUBLIC_WRITE_ENABLED` | 是否启用公开写入限流 | 生产环境保持 `true` |
| `PROTECTION_PUBLIC_WRITE_CAPACITY` | 公开写入周期令牌数 | 默认适合留言类接口 |
| `PROTECTION_PUBLIC_WRITE_REFILL_SECONDS` | 公开写入令牌恢复周期 | 默认 `60` 秒 |
| `PROTECTION_ADMIN_ENABLED` | 是否启用后台限流 | 生产环境保持 `true` |
| `PROTECTION_ADMIN_CAPACITY` | 后台接口周期令牌数 | 比公开读取更严格 |
| `PROTECTION_ADMIN_REFILL_SECONDS` | 后台令牌恢复周期 | 默认 `60` 秒 |
| `PROTECTION_HEAVY_ENABLED` | 是否启用高成本接口限流 | 生产环境保持 `true` |
| `PROTECTION_HEAVY_CAPACITY` | 高成本接口周期令牌数 | 建议按 AI/上传能力设置 |
| `PROTECTION_HEAVY_REFILL_SECONDS` | 高成本接口令牌恢复周期 | 默认 `60` 秒 |
| `PROTECTION_CONCURRENCY_AI_ENABLED` | 是否启用 AI 并发隔离 | 生产环境保持 `true` |
| `PROTECTION_CONCURRENCY_AI_MAX_CONCURRENT` | AI 最大并发数 | 建议先保守设置 |
| `PROTECTION_CONCURRENCY_UPLOAD_ENABLED` | 是否启用上传并发隔离 | 生产环境保持 `true` |
| `PROTECTION_CONCURRENCY_UPLOAD_MAX_CONCURRENT` | 上传最大并发数 | 按磁盘和网络能力设置 |
| `PROTECTION_CONCURRENCY_CONFIG_IMPORT_ENABLED` | 是否启用配置导入并发隔离 | 生产环境保持 `true` |
| `PROTECTION_CONCURRENCY_CONFIG_IMPORT_MAX_CONCURRENT` | 配置导入最大并发数 | 建议保持 `1` |

补充说明：

- 公开只读接口当前还使用应用内 Caffeine 本地缓存，默认过期时间为 `60` 秒。
- 后台系统状态页已可查看当前保护阈值、限流拒绝次数和繁忙拒绝次数。

## 使用建议

1. 正式环境优先基于 `.env.production.example` 生成 `.env`
2. 每次发布时同步更新 `APP_GIT_REVISION` 与 `APP_DEPLOYED_AT`
3. 不要把正式 `.env` 提交进仓库
4. 首次上线后根据后台系统状态页的保护统计，逐步微调并发保护阈值
