# 花语时光系统架构文档

## 1. 系统概览

花语时光是一个以品牌展示、作品展示、内容运营和线索收集为主的鲜花店展示系统，包含三端能力：

- PC Web 前台
- PC Web 管理后台
- 微信小程序前台

当前默认后端主线为 Java + MySQL，默认部署方式为 Docker 三层架构。

## 2. 总体架构

### 2.1 部署拓扑

```text
Browser / WeChat Mini Program
          |
          v
   flower-shop-web (Nginx)
      - 静态资源
      - /api 反向代理
      - /uploads 反向代理
          |
          v
 flower-shop-backend-java
   Spring Boot 3 REST API
          |
          v
        MySQL 8
```

其中：

- Web 容器对外暴露 `WEB_PORT`
- Java 后端容器仅在 Compose 网络内暴露 `3001`
- MySQL 仅在 Compose 网络内提供 `3306`

## 3. 技术栈

### 3.1 前端 Web

- React 19
- TypeScript
- Vite 7
- Tailwind CSS 3
- Ant Design 6
- React Router

### 3.2 后端

- Spring Boot 3
- MyBatis-Plus
- Flyway
- MySQL 8
- Spring Security
- JWT Bearer Token

### 3.3 小程序

- 微信小程序原生框架
- TypeScript
- WXML
- WXSS

## 4. 仓库结构

```text
/workspace/FloralWhisperTime
├── docker-compose.yml
├── deploy.sh
├── docs/
├── shared/
├── flower-shop-web/
├── flower-shop-backend-java/
├── flower-shop-mini/
└── flower-shop-backend/   # 历史兼容实现
```

说明：

- `flower-shop-backend-java/` 是当前默认后端主线
- `flower-shop-backend/` 保留为历史兼容 Node/Express 实现，用于旧版 JSON 数据参考和导入

## 5. Web 架构

### 5.1 路由结构

公开路由：

- `/` 首页
- `/gallery` 作品画廊
- `/gallery/:id` 作品详情
- `/about` 关于我们
- `/contact` 联系我们

后台路由：

- `/admin/login` 管理员登录
- `/admin` 运营总览
- `/admin/flowers` 作品管理
- `/admin/settings` 内容配置
- `/admin/contacts` 用户留言

### 5.2 主要模块

- `Layout`：前台统一导航与页脚
- `ProtectedAdminRoute`：后台鉴权路由守卫
- `AdminShell`：后台整体框架与导航
- `services/api.ts`：统一 API 请求封装

### 5.3 数据访问方式

Web 通过 `src/services/api.ts` 发起请求：

- 本地开发：默认请求 `http://localhost:3001`
- Docker 部署：默认通过同源 `/api`

后台鉴权采用：

- `Authorization: Bearer <token>`
- token 保存在浏览器 `localStorage`

## 6. 后端架构

### 6.1 分层结构

后端采用典型分层：

- `controller/`：REST API 控制器
- `service/`：业务逻辑
- `mapper/`：数据库访问
- `entity/`：数据库实体
- `dto/`：请求/响应对象
- `security/`：JWT 和鉴权逻辑
- `storage/`：上传文件存储
- `migration/`：旧 JSON 数据导入

### 6.2 控制器职责

- `SiteController`
  - 公开站点信息
  - 联系表单
  - 上传接口
- `FlowerController`
  - 作品列表、详情、相关推荐
  - 后台作品 CRUD
- `AdminController`
  - 管理员登录和身份校验
  - 用户留言管理
  - 关于我们页管理
  - 时间轴管理
  - 团队成员管理

### 6.3 数据持久化

- Flyway 负责建表和迁移
- MyBatis-Plus 负责实体映射
- 上传图片文件保存在 `flower-shop-backend-java/uploads/`
- 运行时通过 Docker bind mount 持久化到宿主目录

## 7. 数据模型

核心业务对象：

- `Category`：作品分类
- `Flower`：作品
- `FlowerImage` / `FlowerMaterial` / `FlowerTag`：作品子表
- `SiteConfig`：首页与站点文案
- `ShopInfo` / `ShopHour`：门店信息和营业时间
- `BrandStory` / `BrandStoryImage`：品牌故事
- `AboutPage`：关于我们首屏和正文
- `AboutTimelineEntry`：关于我们时间轴
- `TeamMember`：团队成员
- `Contact`：用户留言

## 8. 认证与安全

### 8.1 认证方式

- 管理员通过 `/api/admin/login` 登录
- 后端签发 JWT Bearer Token
- 受保护接口由 Spring Security 控制

### 8.2 安全相关配置

- `ADMIN_USERNAME`
- `ADMIN_PASSWORD`
- `ADMIN_AUTH_SECRET`
- `JWT_ISSUER`
- `CORS_ALLOWED_ORIGIN_PATTERNS`

生产环境必须替换默认密码和密钥。

## 9. 上传与静态资源

### 9.1 图片上传

- 上传入口：`POST /api/uploads`
- 支持 `multipart/form-data`
- 最大文件大小：5MB

### 9.2 访问方式

- 后端返回 `{ "url": "/uploads/..." }` 或可访问 URL
- Web 容器通过 Nginx 将 `/uploads/` 代理给后端

## 10. 部署架构

### 10.1 Docker Compose 服务

- `mysql`
- `backend`
- `web`

### 10.2 启动顺序

- `mysql` 健康后启动 `backend`
- `backend` 健康后启动 `web`

### 10.3 健康检查

- MySQL：`mysqladmin ping`
- Backend：`GET /api/health`
- Web：通过外部 HTTP 访问首页和反向代理接口验收

## 11. 历史兼容与迁移

仓库仍保留：

- `flower-shop-backend/`
- `flower-shop-backend/data/db.json`

用途：

- 对照旧版接口和数据
- 通过 Java 后端的 JSON 导入能力，将旧数据迁移到 MySQL

这部分不应再视为当前主线运行架构。
