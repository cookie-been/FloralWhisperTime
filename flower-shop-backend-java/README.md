# 花语时光 Java 后端

这是系统当前唯一主线后端，使用 Spring Boot 3、MyBatis-Plus、Flyway 和 JWT，接口服务于现有 Web 和小程序。

补充说明：

- 前台首页统计、后台总览和后台作品管理都按分页聚合全部作品，不再依赖固定 `limit=200/500` 的截断数据

## 技术栈

- Java 17
- Spring Boot 3
- Spring Web MVC
- Spring Security
- MyBatis-Plus
- MySQL 8
- Flyway
- JWT
- Maven

## 准备 MySQL

```sql
CREATE DATABASE floral_whisper_time CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

如果本机没有 MySQL，可用 Docker 单独启动数据库：

```bash
docker compose -f docker-compose.mysql.yml up -d
```

默认连接配置：

```text
DB_URL=jdbc:mysql://localhost:3306/floral_whisper_time?useUnicode=true&characterEncoding=utf8&serverTimezone=Asia/Shanghai&allowPublicKeyRetrieval=true&useSSL=false
DB_USERNAME=root
DB_PASSWORD=root
```

启动时 Flyway 会自动创建表并写入初始数据。

## 启动

```bash
cd flower-shop-backend-java
mvn spring-boot:run
```

也可以显式传入数据库账号：

```bash
DB_USERNAME=root DB_PASSWORD=your_password mvn spring-boot:run
```

默认服务地址：

```text
http://localhost:3001
```

健康检查：

```bash
curl http://localhost:3001/api/health
```

Swagger：

```text
http://localhost:3001/swagger-ui.html
```

## 管理账号

默认：

- 账号：`admin`
- 密码：`Floral@2026`

生产环境请通过环境变量修改：

```bash
ADMIN_USERNAME=admin \
ADMIN_PASSWORD='your-password' \
ADMIN_AUTH_SECRET='replace-with-a-long-random-secret' \
APP_DATA_ENCRYPTION_KEY='replace-with-a-long-random-secret' \
mvn spring-boot:run
```

额外安全相关变量：

- `JWT_EXPIRES_IN_SECONDS`：JWT 过期时间，默认 `43200`
- `JWT_ISSUER`：JWT 签发者，默认 `flower-shop-backend-java`
- `APP_DATA_ENCRYPTION_KEY`：后台敏感配置加密主密钥，用于数据库内 AI API Key 等可逆敏感字段加密
- `CORS_ALLOWED_ORIGIN_PATTERNS`：允许来源，默认 `*`
- `CORS_ALLOWED_METHODS`：允许方法，默认 `GET,POST,PUT,DELETE,OPTIONS`
- `CORS_ALLOWED_HEADERS`：允许请求头，默认 `*`
- `CORS_ALLOW_CREDENTIALS`：是否允许携带凭据，默认 `false`

安全建议：

- `ADMIN_AUTH_SECRET` 与 `APP_DATA_ENCRYPTION_KEY` 必须使用不同的高强度随机值
- 生产环境不要保留默认 `ADMIN_PASSWORD`
- 变更 `APP_DATA_ENCRYPTION_KEY` 前要先做数据迁移或重新录入相关敏感配置

## 兼容接口

- `GET /api/health`
- `POST /api/admin/login`
- `GET /api/admin/me`
- `GET /api/admin/system/status`
- `GET /api/admin/contacts`
- `PATCH /api/admin/contacts/{id}/read`
- `POST /api/admin/ai/images/generate`
- `POST /api/admin/ai/flowers/suggestions`
- `GET /api/flowers`
- `GET /api/flowers/{id}`
- `GET /api/flowers/{id}/related`
- `POST /api/flowers`
- `PUT /api/flowers/{id}`
- `DELETE /api/flowers/{id}`
- `POST /api/uploads`
- `GET /api/categories`
- `GET /api/site-config`
- `PUT /api/site-config`
- `GET /api/admin/system/ai-settings`
- `PUT /api/admin/system/ai-settings`
- `GET /api/about-page`
- `GET /api/about-timeline`
- `GET /api/admin/about-page`
- `PUT /api/admin/about-page`
- `GET /api/admin/about-timeline`
- `POST /api/admin/about-timeline`
- `PUT /api/admin/about-timeline/{id}`
- `DELETE /api/admin/about-timeline/{id}`
- `GET /api/shop-info`
- `GET /api/brand-story`
- `GET /api/team`
- `GET /api/admin/team`
- `POST /api/admin/team`
- `PUT /api/admin/team/{id}`
- `DELETE /api/admin/team/{id}`
- `POST /api/contact`

## 旧 JSON 导入 MySQL

默认不会在启动时导入样例 `db.json`。只有显式打开下面的变量时，应用启动后才会执行一次受控导入：

```bash
JSON_IMPORT_ENABLED=true \
JSON_IMPORT_PATH=src/main/resources/seed/legacy-db.json \
JSON_IMPORT_REPLACE_EXISTING=true \
mvn spring-boot:run
```

说明：

- `JSON_IMPORT_ENABLED=true`：开启导入模式
- `JSON_IMPORT_PATH`：样例 `db.json` 路径
- `JSON_IMPORT_REPLACE_EXISTING=true`：允许先清空现有数据再导入；未开启时，库里已有数据会直接失败退出

导入内容包括：

- 分类、花束与子表
- 站点配置、门店信息、营业时间
- 品牌故事与图片
- 团队成员
- 联系表单记录

## 验证

```bash
mvn test
mvn package
```

## AI 配置说明

后台“AI 生图配置”页面里的 AI 配置现在统一覆盖两类能力：

- 图片生成
  - `model`
  - `baseUrl`
  - `generatePath`
  - `size`
- 作品信息建议
  - `textModel`
  - `textGeneratePath`
  - `textTemperature`
  - `textMaxTokens`

两类能力共享：

- `enabled`
- `provider`
- `apiKey`

安全说明：

- 公开 `GET /api/site-config` 不再返回 AI 配置
- AI 配置只能通过后台管理员接口读取和修改
- 后台读取时返回脱敏后的 `apiKeyMasked` 与 `apiKeyConfigured`
- 系统状态接口 `GET /api/admin/system/status` 也只返回是否配置密钥，不返回明文密钥
- 数据库中的 AI `apiKey` 现在按服务端主密钥加密存储
- 管理员密码变更后使用 `BCrypt` 存储；历史空密码/旧摘要会在后续改密后收敛到新格式

## 系统状态说明

后台新增：

```text
GET /api/admin/system/status
```

用途：

- 检查部署版本
- 检查数据库可用性
- 检查数据库版本与容量
- 检查磁盘总量、可用量与已用比例
- 检查上传目录状态
- 检查上传目录容量
- 检查服务运行时长
- 检查 AI 是否启用及是否已配置密钥
- 检查容器内最近备份目录与最近更新时间
- 下载最近一份备份归档

部署建议：

- 生产容器请显式设置 `BACKUP_DIR`
- Docker Compose 默认已挂载仓库根目录 `./backups` 到容器内 `/app/backups`
- 推荐通过根目录 `deploy.sh` 部署，默认会执行管理员登录与系统状态自检

方舟文本建议默认路径：

```text
/chat/completions
```
