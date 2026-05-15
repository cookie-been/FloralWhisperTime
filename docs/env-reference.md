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

## 使用建议

1. 正式环境优先基于 `.env.production.example` 生成 `.env`
2. 每次发布时同步更新 `APP_GIT_REVISION` 与 `APP_DEPLOYED_AT`
3. 不要把正式 `.env` 提交进仓库
