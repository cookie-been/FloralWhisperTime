# 本地开发 `.env` 示例

本文档给出一份适合本地开发调试使用的环境变量示例。

注意：

- 这是开发用途，不是正式环境模板
- 正式部署请使用：
  - [production-env-template.md](../templates/production-env-template.md)

## 1. Java 后端本地开发

可直接在 shell 中导出，或写入你自己的本地环境文件。

示例：

```bash
export PORT=3001
export DB_URL='jdbc:mysql://localhost:3306/floral_whisper_time?useUnicode=true&characterEncoding=utf8&serverTimezone=Asia/Shanghai&allowPublicKeyRetrieval=true&useSSL=false'
export DB_USERNAME=root
export DB_PASSWORD=root

export ADMIN_USERNAME=admin
export ADMIN_PASSWORD='Floral@2026'
export ADMIN_AUTH_SECRET='dev-admin-auth-secret-please-change-if-needed'
export APP_DATA_ENCRYPTION_KEY='dev-data-encryption-key-please-change-if-needed'
export JWT_ISSUER='flower-shop-backend-java'

export PUBLIC_BASE_URL='http://localhost:3001'
export CORS_ALLOWED_ORIGIN_PATTERNS='http://localhost:5173'

export AI_IMAGE_ENABLED=false
export VOLCENGINE_API_KEY=''
```

启动：

```bash
cd flower-shop-backend-java
mvn spring-boot:run
```

## 2. Web 前端本地开发

前端核心只需要一个变量：

```bash
export VITE_API_BASE_URL='http://localhost:3001'
```

启动：

```bash
cd flower-shop-web
npm run dev
```

## 3. AI 本地联调

如果你要在本地测 AI 生图：

```bash
export AI_IMAGE_ENABLED=true
export VOLCENGINE_API_KEY='你的测试 key'
export VOLCENGINE_IMAGE_MODEL='doubao-seedream-5-0-260128'
```

说明：

- 后台数据库中的 AI 配置优先级高于默认环境值
- 如果你已经在后台保存过 AI 配置，实际生效值以后台保存内容为准

## 4. 本地开发安全提醒

1. 本地开发可以使用开发密钥，但不要把正式密钥直接写进仓库文件
2. `ADMIN_AUTH_SECRET` 和 `APP_DATA_ENCRYPTION_KEY` 最好分开设置
3. 如果你改过本地管理员密码，数据库状态会覆盖初始默认密码逻辑

## 5. 相关文档

- [local-development-guide.md](../local-development-guide.md)
- [pre-production-cutover-checklist.md](../pre-production-cutover-checklist.md)
