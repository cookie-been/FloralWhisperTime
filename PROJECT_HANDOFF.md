# 花语时光鲜花店展示系统交接文档

## 当前基线

项目当前默认运行方式已经切换为企业级三层 Docker 架构：

- `mysql`：MySQL 8，持久化业务数据
- `backend`：`flower-shop-backend-java/`，Spring Boot 3 + MyBatis-Plus + Flyway
- `web`：`flower-shop-web/`，Vite 构建后由 Nginx 托管，并反代 `/api` 和 `/uploads`

`flower-shop-backend/` 仍保留为历史兼容版 Node/Express 后端，仅用于旧数据导入和兼容参考，不是默认部署主线。

## 目录结构

```text
/workspace/FloralWhisperTime
├── flower-shop-backend-java/   # Java + MySQL 主线后端
├── flower-shop-web/            # React PC Web 前台与后台
├── flower-shop-mini/           # 微信小程序
├── flower-shop-backend/        # 历史兼容 Node/Express 后端
├── shared/                     # Web 共享类型与数据结构
├── scripts/catalog/            # 作品批量生成与导入脚本
├── docs/superpowers/           # 设计、计划、迁移与验收文档
├── docker-compose.yml          # 默认部署编排
├── deploy.sh                   # 一键部署脚本
└── README.md                   # 总体说明
```

## 一键部署

在仓库根目录执行：

```bash
./deploy.sh
```

脚本会自动：

- 首次根据 `.env.example` 生成 `.env`
- 自动生成数据库密码、管理员密码、签名密钥
- 创建 `flower-shop-backend-java/uploads/`
- 从源码构建前端和 Java 后端镜像
- 启动 `mysql + backend + web`
- 验证 `/api/health` 和首页可访问

常用参数：

```bash
./deploy.sh --web-port 8081
./deploy.sh --pull
./deploy.sh --skip-build
./deploy.sh --env-file .env.production
```

默认访问入口：

```text
http://localhost:8080
```

## 本地开发

### Java 后端

```bash
cd flower-shop-backend-java
mvn spring-boot:run
```

默认地址：

```text
http://localhost:3001
```

### Web

```bash
cd flower-shop-web
npm install
npm run dev
```

默认地址：

```text
http://localhost:5173
```

### 小程序

微信开发者工具导入：

```text
flower-shop-mini
```

真机调试前，需要把 `flower-shop-mini/config/api.ts` 改成局域网 IP 或正式 HTTPS 域名，并配置微信小程序合法域名。

## 后台功能

当前 Web 管理后台包含七个一级入口：

- `/admin`：运营总览
- `/admin/flowers`：作品管理
- `/admin/settings`：站点配置
- `/admin/ai-settings`：AI 生图配置
- `/admin/contacts`：用户留言
- `/admin/system`：系统状态
- `/admin/operation-logs`：操作日志

其中“站点配置”统一维护：

- 首页首屏内容
- 门店信息与营业时间
- 品牌故事
- 关于我们页首图/标题/副标题
- 时间轴
- 团队成员

补充说明：

- 首页统计数据由系统真实数据自动计算，不再由后台人工维护
- AI 生图相关密钥、模型和接口参数通过独立的 `/admin/ai-settings` 页面维护
- `/admin/operation-logs` 记录后台写操作与登录行为，并支持按快照恢复

## 数据与持久化

- MySQL 数据：Docker volume `floral_whisper_mysql`
- 上传文件：`flower-shop-backend-java/uploads/`
- Web 静态资源：构建进入容器镜像

历史兼容数据源仍保留在：

```text
flower-shop-backend/data/db.json
```

Java 后端支持一次性 JSON 导入，用于从旧库迁移到 MySQL。

## 默认环境变量

根目录 `.env.example` 包含部署基线参数，核心字段有：

- `WEB_PORT`
- `MYSQL_DATABASE`
- `MYSQL_USER`
- `MYSQL_PASSWORD`
- `MYSQL_ROOT_PASSWORD`
- `ADMIN_USERNAME`
- `ADMIN_PASSWORD`
- `ADMIN_AUTH_SECRET`
- `JWT_ISSUER`
- `CORS_ALLOWED_ORIGIN_PATTERNS`

生产环境必须替换默认密码和密钥。

## 关键文件

- 部署脚本：`deploy.sh`
- 编排文件：`docker-compose.yml`
- Java 运行时镜像：`flower-shop-backend-java/Dockerfile.runtime`
- Web 运行时镜像：`flower-shop-web/Dockerfile.runtime`
- Web 路由：`flower-shop-web/src/router/index.tsx`
- Web API：`flower-shop-web/src/services/api.ts`
- Java 应用配置：`flower-shop-backend-java/src/main/resources/application.yml`
- Flyway 迁移：`flower-shop-backend-java/src/main/resources/db/migration/`

## 验收方式

基础容器验收：

```bash
docker compose ps
curl -fsS http://localhost:8080/api/health
curl -I http://localhost:8080/
```

更完整的 Docker 验收流程见：

- `docs/superpowers/migration-checklists/2026-05-13-docker-cutover-runbook.md`

## 当前保留但非主线的内容

- `flower-shop-backend/`：历史兼容 Node/Express 后端
- `flower-shop-backend/data/db.json`：旧版 JSON 数据
- `flower-shop-backend-java` 的 JSON 导入能力：用于一次性历史数据迁移

这些内容仍然有用，但不应再被当作默认运行主线。
