# 花语时光鲜花店展示系统

根据 `鲜花店展示方案.zip` 实现的纯展示型双端应用，包含 PC Web 和微信小程序。

当前默认部署基线为企业级三层结构：

- `mysql`：MySQL 8.4，持久化存储
- `flower-shop-backend-java`：Spring Boot 3 + MyBatis-Plus + Flyway
- `flower-shop-web`：Nginx 托管静态站点并反向代理 `/api` 与 `/uploads`

## 目录

- `shared/`：双端共享的 TypeScript 类型、Mock 数据和 API 封装。
- `flower-shop-backend/`：Express 后端、本地 JSON 数据库和图片上传目录。
- `flower-shop-web/`：React + TypeScript + Vite + Tailwind CSS + Ant Design PC Web。
- `flower-shop-mini/`：微信小程序原生框架 + TypeScript + WXSS。

## 旧版 Node 后端运行（兼容保留）

```bash
cd flower-shop-backend
npm install
npm run dev
```

这是历史兼容实现，不再作为默认部署主线。数据保存在 `flower-shop-backend/data/db.json`，上传图片保存在 `flower-shop-backend/uploads/`。

## Java + MySQL 后端

`flower-shop-backend-java/` 是后端的 Java 重构版，使用 Spring Boot 3 + MyBatis-Plus + MySQL + Flyway，接口兼容原 `/api/*`。

```sql
CREATE DATABASE floral_whisper_time CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

```bash
cd flower-shop-backend-java
DB_USERNAME=root DB_PASSWORD=root mvn spring-boot:run
```

默认服务地址同样是 `http://localhost:3001`。启动后 Web 端无需修改，继续请求 `http://localhost:3001`。

## PC Web 运行

```bash
cd flower-shop-web
npm install
npm run dev
```

Web 默认请求 `http://localhost:3001`。如需改后端地址，可设置环境变量 `VITE_API_BASE_URL`。

## PC Web 构建

```bash
cd flower-shop-web
npm run build
```

## Docker 部署

项目根目录的 `docker-compose.yml` 现在以 Java + MySQL 为默认部署主线，符合当前企业级架构设计。Flyway 会在后端启动时自动迁移企业级表结构。

```bash
cp .env.example .env
docker compose up -d --build
```

也可以直接执行仓库根目录的一键部署脚本：

```bash
chmod +x deploy.sh
./deploy.sh
```

脚本会自动完成这些动作：

- 首次部署时根据 `.env.example` 生成 `.env`
- 自动生成数据库密码、管理员密码、签名密钥
- 创建上传目录
- 从源码构建前端与 Java 后端容器镜像
- 启动 `mysql + backend + web`
- 自动等待 `/api/health` 和首页可访问

常用参数：

```bash
./deploy.sh --env-file .env.production --web-port 8081
./deploy.sh --pull
./deploy.sh --skip-build
```

默认访问地址：`http://localhost:8080`

可在 `.env` 中调整：

- `WEB_PORT`：Web 对外端口，默认 `8080`
- `MYSQL_DATABASE`：数据库名，默认 `floral_whisper_time`
- `MYSQL_USER`：业务库用户名
- `MYSQL_PASSWORD`：业务库密码
- `MYSQL_ROOT_PASSWORD`：MySQL root 密码
- `ADMIN_USERNAME`：管理账号，默认 `admin`
- `ADMIN_PASSWORD`：管理密码，默认 `Floral@2026`
- `ADMIN_AUTH_SECRET`：登录 token 签名密钥，生产环境必须改成随机长字符串
- `JWT_ISSUER`：JWT 签发者
- `CORS_ALLOWED_ORIGIN_PATTERNS`：允许的来源模式

持久化策略：

- MySQL 数据：Docker volume `floral_whisper_mysql`
- 上传文件：`flower-shop-backend-java/uploads:/app/uploads`

浏览器只需要访问 Web 端口。Web 容器会把 `/api` 和 `/uploads` 反向代理到 Java 后端容器。

完整容器验收手册见 [docs/superpowers/migration-checklists/2026-05-13-docker-cutover-runbook.md](/workspace/FloralWhisperTime/docs/superpowers/migration-checklists/2026-05-13-docker-cutover-runbook.md)。

## 小程序预览

使用微信开发者工具导入 `flower-shop-mini` 目录。

小程序默认请求 `flower-shop-mini/config/api.ts` 中的 `http://localhost:3001`。真机预览时请改成电脑局域网 IP 或正式 HTTPS 域名，并在微信小程序后台配置 request 合法域名。

## 功能范围

当前版本支持品牌和花束作品展示、作品分类、搜索、排序、详情、相关推荐、门店信息、地图、联系入口，以及 Web 端 `/admin/login` 登录后的作品新增、编辑、删除、图片上传和 `/admin/settings` 站点配置管理。不包含购物车、支付、订单、库存、客户会员系统。
