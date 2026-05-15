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
└── flower-shop-mini/
```

说明：

- `flower-shop-backend-java/` 是当前默认后端主线
- `flower-shop-mini/` 保留为独立小程序端，使用本地 `shared/` 副本

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
- `/admin/settings` 站点配置
- `/admin/ai-settings` AI 生图配置
- `/admin/contacts` 用户留言
- `/admin/system` 系统状态
- `/admin/operation-logs` 操作日志

### 5.2 主要模块

- `Layout`：前台统一导航与页脚
- `ProtectedAdminRoute`：后台鉴权路由守卫
- `AdminShell`：后台整体框架与导航
- `services/api.ts`：统一 API 请求封装

补充：

- `services/api.ts` 提供 `listAllFlowers()`，用于按分页拉取全部作品，保证首页统计、后台总览和作品管理在大数据量下仍能保持真实口径

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
  - 系统状态与备份下载
  - AI 配置管理
  - 操作日志查询与恢复
  - 关于我们页管理
  - 时间轴管理
  - 团队成员管理

### 6.3 数据持久化

- Flyway 负责建表和迁移
- MyBatis-Plus 负责实体映射
- 上传图片文件保存在 `flower-shop-backend-java/uploads/`
- 运行时通过 Docker bind mount 持久化到宿主目录

### 6.4 基础并发保护

当前单机单实例部署已经补齐三层基础保护：

- 路由分级限流
  - 公开读取
  - 公开写入
  - 管理后台
  - 高成本接口
- 高成本接口并发隔离
  - AI 生图 / AI 文案建议
  - 图片上传
  - 配置导入
- 公开只读热点缓存
  - 站点配置
  - 门店信息
  - 品牌故事
  - 关于页 / 时间轴 / 团队
  - 分类列表

实现方式：

- Spring MVC Interceptor + Bucket4j：入口限流
- Semaphore：重接口并发隔离
- Caffeine：单机本地只读缓存

该方案的目标是先解决短时间突发流量导致线程、数据库连接和 AI 重任务堆积的问题，同时为后续 Redis、网关限流和多实例横向扩容保留清晰边界。

### 6.5 运行态可观测性

后台 `/admin/system` 系统状态页已经增加并发保护摘要，当前可直接查看：

- 基础限流是否启用
- 四组路由限流阈值
- 三组重接口并发阈值
- 已触发限流次数
- 已触发繁忙拒绝次数

这部分用于部署后巡检、容量预估和后续商业化售后排障。

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
- `OperationLog`：后台操作日志与恢复链路
- `AiSettings`：后台 AI 配置

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

补充：

- 实际访问端口以 `deploy.sh` / `upgrade.sh` 输出的 `Site URL` 为准

### 10.4 后续高可用演进方向

当前默认交付仍以单机单实例为主，后续可以按以下顺序扩展：

1. Nginx / 云网关前置统一限流
2. 后端多实例化
3. 将本地限流与热点缓存迁移到 Redis
4. 将上传目录迁移到对象存储
5. 引入独立的备份、监控和告警组件

这样可以保持当前版本易交付、易维护，同时不阻塞后续商业化扩展。

## 11. 历史数据导入

Java 后端仍保留受控 JSON 导入能力，用于初始化或迁移历史样例数据：

- 默认样例路径：`flower-shop-backend-java/src/main/resources/seed/legacy-db.json`
- 启用方式：通过 `JSON_IMPORT_ENABLED=true` 显式开启

这部分仅作为初始化工具，不属于线上运行主链路。
