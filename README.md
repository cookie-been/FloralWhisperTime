# 花语时光鲜花店展示系统

根据 `鲜花店展示方案.zip` 实现的纯展示型双端应用，包含 PC Web 和微信小程序。

## 目录

- `shared/`：双端共享的 TypeScript 类型、Mock 数据和 API 封装。
- `flower-shop-backend/`：Express 后端、本地 JSON 数据库和图片上传目录。
- `flower-shop-web/`：React + TypeScript + Vite + Tailwind CSS + Ant Design PC Web。
- `flower-shop-mini/`：微信小程序原生框架 + TypeScript + WXSS。

## 后端运行

```bash
cd flower-shop-backend
npm install
npm run dev
```

默认服务地址为 `http://localhost:3001`，数据保存在 `flower-shop-backend/data/db.json`，上传图片保存在 `flower-shop-backend/uploads/`。

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

项目提供 `docker-compose.yml`，会构建后端 Node 服务和 Web Nginx 静态站点。Web 容器会把 `/api` 和 `/uploads` 反向代理到后端，因此浏览器只需要访问 Web 端口。

```bash
cp .env.example .env
docker compose up -d --build
```

默认访问地址：`http://localhost:8080`

可在 `.env` 中调整：

- `WEB_PORT`：Web 对外端口，默认 `8080`
- `ADMIN_USERNAME`：管理账号，默认 `admin`
- `ADMIN_PASSWORD`：管理密码，默认 `Floral@2026`
- `ADMIN_AUTH_SECRET`：登录 token 签名密钥，生产环境必须改成随机长字符串

后端数据和上传图片通过宿主机目录持久化：

- `flower-shop-backend/data:/app/data`
- `flower-shop-backend/uploads:/app/uploads`

## 小程序预览

使用微信开发者工具导入 `flower-shop-mini` 目录。

小程序默认请求 `flower-shop-mini/config/api.ts` 中的 `http://localhost:3001`。真机预览时请改成电脑局域网 IP 或正式 HTTPS 域名，并在微信小程序后台配置 request 合法域名。

## 功能范围

当前版本支持品牌和花束作品展示、作品分类、搜索、排序、详情、相关推荐、门店信息、地图、联系入口，以及 Web 端 `/admin/login` 登录后的作品新增、编辑、删除、图片上传和 `/admin/settings` 站点配置管理。不包含购物车、支付、订单、库存、客户会员系统。
