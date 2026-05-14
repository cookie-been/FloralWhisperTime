# 花语时光鲜花店展示系统

当前默认基线是企业级 Docker 部署：

- `mysql`：MySQL 8
- `flower-shop-backend-java`：Spring Boot 3 + MyBatis-Plus + Flyway
- `flower-shop-web`：React 19 + Vite 7 + Ant Design 6，产物由 Nginx 托管并反代 `/api`、`/uploads`
- `flower-shop-mini`：微信小程序原生（TypeScript + WXML + WXSS）

`flower-shop-backend/` 仍保留为历史兼容实现，但不是默认运行主线。

## QUICK START

```bash
# 一键部署整站
./deploy.sh

# 或分别启动
docker compose up -d --build

# Web 本地开发
cd flower-shop-web && npm install && npm run dev

# Java 后端本地开发
cd flower-shop-backend-java && mvn spring-boot:run

# 小程序：微信开发者工具导入 flower-shop-mini
```

## KEY FACTS

- **默认部署**：使用仓库根 `docker-compose.yml`
- **后端主线**：`flower-shop-backend-java/`，接口前缀统一为 `/api/*`
- **Web API 基址**：开发态通过 `VITE_API_BASE_URL` 指向后端；容器部署态默认走同源 `/api`
- **管理员默认账号**：`admin` / `Floral@2026`，生产环境必须改
- **上传目录**：`flower-shop-backend-java/uploads/`，由 compose bind mount 持久化
- **共享代码**：`shared/` 供 Web 使用；小程序使用 `flower-shop-mini/shared/` 本地副本
- **Web 构建**：必须 `tsc -b && vite build`
- **Docker 一键脚本**：`deploy.sh`

## WEB ROUTES

| 路径 | 页面 | 鉴权 |
|------|------|------|
| `/` | 首页 | 无 |
| `/gallery` | 作品画廊 | 无 |
| `/gallery/:id` | 作品详情 | 无 |
| `/about` | 关于我们 | 无 |
| `/contact` | 联系我们 | 无 |
| `/admin/login` | 管理员登录 | 无 |
| `/admin` | 运营总览 | Bearer token |
| `/admin/flowers` | 作品管理 | Bearer token |
| `/admin/settings` | 内容配置 | Bearer token |
| `/admin/contacts` | 用户留言 | Bearer token |

## ENV VARS

| 变量 | 所属 | 默认值 |
|------|------|--------|
| `WEB_PORT` | Docker Web | `8080` |
| `MYSQL_DATABASE` | Docker MySQL | `floral_whisper_time` |
| `MYSQL_USER` | Docker MySQL | `floral_whisper` |
| `MYSQL_PASSWORD` | Docker MySQL | `change-me` |
| `MYSQL_ROOT_PASSWORD` | Docker MySQL | `change-root-password` |
| `PORT` | Java 后端 | `3001` |
| `DB_URL` | Java 后端 | `jdbc:mysql://mysql:3306/...` |
| `DB_USERNAME` | Java 后端 | `floral_whisper` |
| `DB_PASSWORD` | Java 后端 | `change-me` |
| `ADMIN_USERNAME` | Java 后端 | `admin` |
| `ADMIN_PASSWORD` | Java 后端 | `Floral@2026` |
| `ADMIN_AUTH_SECRET` | Java 后端 | `replace-with-a-long-random-secret` |
| `JWT_ISSUER` | Java 后端 | `flower-shop-backend-java` |
| `CORS_ALLOWED_ORIGIN_PATTERNS` | Java 后端 | `*` |
| `VITE_API_BASE_URL` | Web 本地开发 | `http://localhost:3001` |
| `API_BASE_URL` | 小程序 | `http://localhost:3001` |

## ANTI-PATTERNS

- 勿把 `.env`、上传目录、构建日志提交进仓库
- 勿直接依赖根目录旧版 `project.config.json`，小程序只认 `flower-shop-mini/` 内配置
- Web 构建勿跳过 `tsc -b`
- 勿删除 `shared/` 与 `flower-shop-mini/shared/` 而不同时处理引用
- 若修改 Docker 部署链，优先验证 `./deploy.sh` 和 `docker compose up -d --build`

## SUBDIR AGENTS

每个子目录都有独立 `AGENTS.md`，描述该子项目的边界、命令与注意事项。
