# Docker Cutover Runbook

日期：2026-05-13

目标：按企业级默认架构启动并验收 `mysql + flower-shop-backend-java + flower-shop-web`。

## 1. 架构基线

- `mysql`：MySQL 8.4，持久化卷 `floral_whisper_mysql`
- `backend`：Spring Boot 3 + MyBatis-Plus + Flyway
- `web`：Nginx 静态站点，反向代理 `/api` 和 `/uploads`

默认对外入口：

- Web：`http://localhost:8080`
- Backend 容器内端口：`3001`
- MySQL 容器内端口：`3306`

## 2. 启动前准备

在仓库根目录执行：

```bash
cd /workspace/FloralWhisperTime
cp .env.example .env
```

至少检查并替换以下配置：

```dotenv
WEB_PORT=8080
MYSQL_DATABASE=floral_whisper_time
MYSQL_USER=floral_whisper
MYSQL_PASSWORD=change-me
MYSQL_ROOT_PASSWORD=change-root-password
ADMIN_USERNAME=admin
ADMIN_PASSWORD=Floral@2026
ADMIN_AUTH_SECRET=replace-with-a-long-random-secret
JWT_ISSUER=flower-shop-backend-java
CORS_ALLOWED_ORIGIN_PATTERNS=*
```

生产环境必须替换：

- `MYSQL_PASSWORD`
- `MYSQL_ROOT_PASSWORD`
- `ADMIN_PASSWORD`
- `ADMIN_AUTH_SECRET`
- `CORS_ALLOWED_ORIGIN_PATTERNS`

## 3. 启动服务

```bash
cd /workspace/FloralWhisperTime
docker compose up -d --build
```

查看容器状态：

```bash
docker compose ps
```

预期：

- `mysql` 为 `healthy`
- `backend` 为 `healthy`
- `web` 为 `running`

## 4. 观察启动日志

看后端日志，确认 Flyway 和 Spring Boot 启动成功：

```bash
docker compose logs -f backend
```

关键观察点：

- Flyway 已执行迁移
- 无数据库认证失败
- 无端口占用
- 出现健康启动日志

看数据库日志：

```bash
docker compose logs --tail=200 mysql
```

看 Web 日志：

```bash
docker compose logs --tail=200 web
```

## 5. 数据库验收

进入 MySQL 容器执行检查：

```bash
docker compose exec mysql mysql -uroot -p"$MYSQL_ROOT_PASSWORD" -e "SHOW DATABASES;"
```

检查 Flyway 表和核心业务表：

```bash
docker compose exec mysql mysql -uroot -p"$MYSQL_ROOT_PASSWORD" "$MYSQL_DATABASE" -e "
SHOW TABLES;
SELECT version, description, success FROM flyway_schema_history ORDER BY installed_rank;
"
```

预期至少包含这些表：

- `categories`
- `flowers`
- `flower_images`
- `flower_materials`
- `flower_tags`
- `site_config`
- `site_config_stats`
- `shop_info`
- `shop_hours`
- `brand_story`
- `brand_story_images`
- `team_members`
- `contacts`

检查种子数据：

```bash
docker compose exec mysql mysql -uroot -p"$MYSQL_ROOT_PASSWORD" "$MYSQL_DATABASE" -e "
SELECT COUNT(*) AS categories FROM categories;
SELECT COUNT(*) AS flowers FROM flowers;
SELECT COUNT(*) AS flower_images FROM flower_images;
SELECT COUNT(*) AS site_config_stats FROM site_config_stats;
SELECT COUNT(*) AS team_members FROM team_members;
"
```

## 6. HTTP 冒烟验收

健康检查：

```bash
curl -fsS http://localhost:8080/api/health
```

管理员登录：

```bash
curl -sS -X POST http://localhost:8080/api/admin/login \
  -H 'Content-Type: application/json' \
  -d '{"username":"admin","password":"Floral@2026"}'
```

保存返回的 `token` 后继续：

```bash
TOKEN="<paste-token-here>"
```

校验管理身份：

```bash
curl -sS http://localhost:8080/api/admin/me \
  -H "Authorization: Bearer $TOKEN"
```

公开接口检查：

```bash
curl -sS http://localhost:8080/api/flowers
curl -sS http://localhost:8080/api/categories
curl -sS http://localhost:8080/api/site-config
curl -sS http://localhost:8080/api/shop-info
curl -sS http://localhost:8080/api/brand-story
curl -sS http://localhost:8080/api/team
```

联系表单写入检查：

```bash
curl -sS -X POST http://localhost:8080/api/contact \
  -H 'Content-Type: application/json' \
  -d '{"name":"Docker验收","phone":"13800000000","message":"runbook smoke test"}'
```

预期返回：

```json
{"success":true}
```

## 7. 上传链路验收

准备测试文件：

```bash
printf 'test image content\n' >/tmp/floral-upload-test.txt
```

执行上传：

```bash
curl -sS -X POST http://localhost:8080/api/uploads \
  -H "Authorization: Bearer $TOKEN" \
  -F "file=@/tmp/floral-upload-test.txt"
```

预期返回：

```json
{"url":"/uploads/..."}
```

继续验证回源：

```bash
curl -I http://localhost:8080/uploads/<returned-file-name>
```

## 8. 页面级验收

浏览器人工检查：

- `/`
- `/gallery`
- `/gallery/:id`
- `/about`
- `/contact`
- `/admin/login`
- `/admin`
- `/admin/flowers`
- `/admin/settings`

重点确认：

- 首页可展示统计、精选作品、品牌故事
- 作品列表和详情可正常加载
- 管理员可登录
- 管理后台可读取作品列表
- 站点配置页可读取内容
- 上传接口可成功返回 URL

## 9. 旧 JSON 导入验收（如需）

如果需要把旧 `db.json` 导入到 MySQL，使用一次性导入模式：

```bash
docker compose run --rm \
  -e JSON_IMPORT_ENABLED=true \
  -e JSON_IMPORT_PATH=../flower-shop-backend/data/db.json \
  -e JSON_IMPORT_REPLACE_EXISTING=true \
  backend
```

导入后重新启动后端：

```bash
docker compose up -d backend
```

再执行一次第 5 节和第 6 节检查。

## 10. 常见故障排查

### 10.1 Docker daemon 不可用

现象：

- `docker info` 或 `docker compose up` 报 `/var/run/docker.sock` 不存在

处理：

- 先启动 Docker daemon
- 再执行 `docker info`

### 10.2 MySQL 一直不健康

先看日志：

```bash
docker compose logs --tail=200 mysql
```

常见原因：

- `MYSQL_ROOT_PASSWORD` 配置不一致
- 数据卷里已有旧实例数据
- 端口冲突或容器资源不足

### 10.3 Backend 启动失败

先看日志：

```bash
docker compose logs --tail=300 backend
```

优先检查：

- `DB_URL`、`DB_USERNAME`、`DB_PASSWORD`
- Flyway 迁移是否报错
- `ADMIN_AUTH_SECRET` 是否为空
- 上传目录挂载是否成功

### 10.4 Web 可打开但接口 502/504

先看：

```bash
docker compose ps
docker compose logs --tail=200 web
docker compose logs --tail=200 backend
```

优先检查：

- `backend` 是否 healthy
- Nginx 反代目标是否仍为 `backend:3001`
- 后端接口是否可在容器内访问

### 10.5 上传成功但图片打不开

检查：

```bash
docker compose exec backend ls -la /app/uploads
docker compose logs --tail=200 web
```

优先检查：

- 返回 URL 是否以 `/uploads/` 开头
- 上传文件是否实际写入 `/app/uploads`
- Nginx 是否正确代理 `/uploads/`

## 11. 停止与清理

停止服务：

```bash
docker compose down
```

连数据卷一起清理：

```bash
docker compose down -v
```

注意：`down -v` 会删除 MySQL 数据卷。
