# Java 后端切换检查清单

日期：2026-05-13

目标：将 `flower-shop-backend-java` 作为主后端，对外继续保持 `/api/*` 兼容。

## 1. 数据库准备

- [ ] MySQL 8 可连接
- [ ] 已创建数据库 `floral_whisper_time`
- [ ] `DB_URL` / `DB_USERNAME` / `DB_PASSWORD` 已配置
- [ ] Flyway 启动迁移成功

## 2. 安全配置

- [ ] 已替换 `ADMIN_USERNAME`
- [ ] 已替换 `ADMIN_PASSWORD`
- [ ] 已替换 `ADMIN_AUTH_SECRET`
- [ ] 已确认 `JWT_EXPIRES_IN_SECONDS`
- [ ] 已确认 `JWT_ISSUER`
- [ ] 已确认 `CORS_ALLOWED_ORIGIN_PATTERNS`

## 3. 导入旧数据（如需）

- [ ] 已确认旧 JSON 文件路径
- [ ] 首次导入前数据库为空，或显式设置 `JSON_IMPORT_REPLACE_EXISTING=true`
- [ ] 使用 `JSON_IMPORT_ENABLED=true` 启动一次导入
- [ ] 启动日志已输出分类、花束、图片、花材、标签、站点内容和联系人导入数量

示例：

```bash
cd flower-shop-backend-java
JSON_IMPORT_ENABLED=true \
JSON_IMPORT_PATH=../flower-shop-backend/data/db.json \
JSON_IMPORT_REPLACE_EXISTING=true \
DB_USERNAME=root \
DB_PASSWORD=root \
mvn spring-boot:run
```

## 4. 接口冒烟

- [ ] `GET /api/health`
- [ ] `POST /api/admin/login`
- [ ] `GET /api/admin/me`
- [ ] `GET /api/flowers`
- [ ] `GET /api/site-config`
- [ ] `POST /api/uploads`
- [ ] `POST /api/contact`

示例：

```bash
curl http://localhost:3001/api/health

curl -X POST http://localhost:3001/api/admin/login \
  -H 'Content-Type: application/json' \
  -d '{"username":"admin","password":"Floral@2026"}'
```

## 5. 本地验证结果

- [x] `cd flower-shop-backend-java && mvn test`
- [x] `cd flower-shop-backend-java && mvn package`

## 6. 切流前确认

- [ ] 前端环境变量已切到 Java 后端地址
- [ ] 管理后台登录、作品列表、站点配置和上传已人工验收
- [ ] 已保留回滚方案（旧 Node 服务与旧 JSON 数据）
