# flower-shop-backend-java

Spring Boot 3 + MyBatis-Plus + MySQL 后端，是当前默认后端主线。

## COMMANDS

```bash
mvn spring-boot:run
mvn package
mvn test
```

默认端口：`3001`

## ENV VARS

| 变量 | 默认值 |
|------|--------|
| `PORT` | `3001` |
| `DB_URL` | `jdbc:mysql://localhost:3306/floral_whisper_time?...` |
| `DB_USERNAME` | `root` |
| `DB_PASSWORD` | `root` |
| `ADMIN_USERNAME` | `admin` |
| `ADMIN_PASSWORD` | `Floral@2026` |
| `ADMIN_AUTH_SECRET` | `floral-whisper-time-java-dev-secret-change-me` |
| `PUBLIC_BASE_URL` | `http://localhost:${server.port}` |
| `UPLOAD_DIR` | `uploads` |
| `JSON_IMPORT_ENABLED` | `false` |
| `JSON_IMPORT_PATH` | `src/main/resources/seed/legacy-db.json` |

## STRUCTURE

- `controller/`：兼容前端的 REST API
- `service/`：业务逻辑
- `mapper/`：MyBatis-Plus Mapper
- `entity/`：数据库实体
- `dto/`：请求/响应结构
- `security/`：JWT Bearer token
- `storage/`：图片上传
- `db/migration/`：Flyway 建表和初始数据
- `migration/`：旧版 JSON 数据导入

## NOTES

- 保持响应错误格式 `{ "message": "..." }`，前端依赖该格式展示错误。
- 管理端继续使用 `Authorization: Bearer <token>`。
- 图片上传接口返回 `{ "url": "..." }`，本地默认是绝对 URL；`PUBLIC_BASE_URL` 为空时可返回相对 `/uploads/...`。
- 当前后台还包含留言管理、关于我们页配置、时间轴和团队成员管理相关接口。
