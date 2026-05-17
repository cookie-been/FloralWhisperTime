# 花语时光系统架构文档

## 1. 系统概览

花语时光是一个以品牌展示、作品展示、内容运营和线索收集为主的鲜花店展示系统，包含：

- PC Web 前台
- PC Web 管理后台
- 微信小程序前台
- Java + MySQL 后端

默认交付形态为 Docker 三层结构，适合单机部署、标准化交付和后续平滑扩展。

## 2. 总体架构

### 2.1 部署拓扑

```text
Browser / WeChat Mini Program
          |
          v
   flower-shop-web (Nginx)
      - 静态站点
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

说明：

- `web` 对外暴露访问端口
- `backend` 默认仅在 Compose 网络内暴露 `3001`
- `mysql` 默认仅在 Compose 网络内暴露 `3306`

## 3. 技术栈

### 3.1 Web 前端

- React 19
- TypeScript
- Vite 7
- Tailwind CSS 3
- Ant Design
- React Router

### 3.2 后端

- Spring Boot 3
- Spring Security
- JWT
- MyBatis-Plus
- Flyway
- MySQL 8
- Caffeine

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
├── backup.sh
├── upgrade.sh
├── rollback.sh
├── restore.sh
├── ops/
├── docs/
├── logo/
├── shared/
├── flower-shop-web/
├── flower-shop-backend-java/
└── flower-shop-mini/
```

目录职责：

- `flower-shop-web/`：PC Web 前台与管理后台
- `flower-shop-backend-java/`：主线业务后端
- `flower-shop-mini/`：微信小程序
- `ops/`：部署、发布、升级、回滚、巡检脚本
- `docs/`：正式交付与运维文档
- `logo/`：品牌 Logo 原始素材

## 5. Web 架构

### 5.1 路由结构

公开路由：

- `/`
- `/gallery`
- `/gallery/:id`
- `/about`
- `/contact`

后台路由：

- `/admin/login`
- `/admin`
- `/admin/flowers`
- `/admin/settings`
- `/admin/ai-settings`
- `/admin/contacts`
- `/admin/system`
- `/admin/operation-logs`

### 5.2 后台结构

后台由 `AdminShell` 承载，当前核心特点包括：

- 左侧一级导航
- 顶部已打开页面导航切换
- 页面级标题、副标题、说明文案动态配置
- 小屏适配抽屉导航

其中：

- `站点配置` 采用 Tabs 维护站点动态内容
- `运维中心` 采用 Tabs 维护巡检、备份、安全、归档和迁移能力

### 5.3 Web 数据访问

Web 统一通过 `flower-shop-web/src/services/api.ts` 调用后端接口。

策略包括：

- 公共内容走公开 API
- 后台写操作走受保护接口
- 少量公开只读数据做短时缓存
- 后台写操作后自动失效相关缓存

## 6. 后端架构

### 6.1 分层结构

后端采用典型分层：

- `controller/`：REST API
- `service/`：业务逻辑
- `mapper/`：数据库访问
- `entity/`：实体模型
- `dto/`：请求与响应模型
- `config/`：配置与安全
- `security/`：JWT 与鉴权过滤器
- `service/ai/`：AI 相关能力

### 6.2 控制器职责

- `SiteController`
  - 公开站点内容
  - 公开门店信息
  - 关于我们
  - 留言提交
  - 图片上传
- `FlowerController`
  - 作品公开列表与详情
  - 后台作品创建、修改、删除
- `AdminController`
  - 管理员登录与改密
  - 系统状态
  - 备份、巡检、配置导入导出
  - 站点配置、About、时间轴、团队
  - 留言管理
  - 操作日志与恢复
- `AdminAiController`
  - AI 生图
  - AI 作品信息建议

### 6.3 数据持久化

数据持久化方式：

- 业务数据：MySQL
- 数据结构演进：Flyway
- 上传文件：`uploads/`
- AI 生成图片：`uploads/ai/`
- 日志归档：操作日志归档目录

### 6.4 逻辑删除策略

以下模块已改为逻辑删除：

- `flowers`
- `contacts`
- `about_timeline_entries`
- `team_members`

实现方式：

- 增加 `deleted` 字段
- 后台列表支持 `active / deleted / all` 筛选
- 提供恢复接口

这样做可以兼顾：

- 降低误删风险
- 配合操作日志恢复
- 满足商业交付后的运营追溯需求

### 6.5 审计与恢复

系统已内置操作日志能力：

- 记录后台写操作
- 记录登录与改密等关键安全动作
- 保留请求摘要
- 保留前后快照
- 支持按日志恢复
- 记录恢复来源链路

这部分是交付后“可追溯、可恢复”的核心能力之一。

## 7. 认证与安全

### 7.1 认证机制

后台当前采用：

- Spring Security
- JWT Bearer Token

权限要点：

- `/api/admin/**` 受管理员权限保护
- `/api/admin/ai/**` 受管理员权限保护
- `POST /api/flowers`
- `PUT /api/flowers/**`
- `DELETE /api/flowers/**`
- `POST /api/uploads`
- `PUT /api/site-config`

以上写接口均要求管理员身份。

### 7.2 密码与密钥

当前安全基线包括：

- 管理员默认账号来自环境变量
- 首次登录强制修改密码
- 修改后的管理员密码使用 BCrypt 存储
- JWT 密钥来自 `ADMIN_AUTH_SECRET`
- 数据加密密钥来自 `APP_DATA_ENCRYPTION_KEY`
- AI Key 以脱敏形式在后台展示

### 7.3 安全响应头与 CORS

后端已配置：

- CORS 白名单
- `Referrer-Policy`
- `X-Permitted-Cross-Domain-Policies`
- JWT 失效统一 JSON 错误响应

## 8. 稳定性保护

### 8.1 路由分级限流

当前系统内置 4 组基础限流：

- 公开读取
- 公开写入
- 管理后台
- 高成本接口

### 8.2 并发隔离

以下高成本接口已做并发隔离：

- AI 生图 / AI 文案建议
- 图片上传
- 配置导入

### 8.3 公开只读缓存

当前缓存对象主要包括：

- 站点配置
- 门店信息
- 品牌故事
- About 内容
- 分类列表

### 8.4 运行态可观测性

运维中心可直接查看：

- 限流阈值
- 并发阈值
- 已触发限流次数
- 已触发繁忙拒绝次数
- AI 配置状态
- 当前安全风险摘要

## 9. 文件上传与媒体资源

### 9.1 上传能力

- 上传接口：`POST /api/uploads`
- 单文件大小限制：20MB
- 请求体总限制：64MB

### 9.2 媒体资源配置

当前媒体资源配置包含：

- 品牌 Logo
- 首页主图
- 首页轮播图
- 后台登录页轮播图
- 联系页配图
- 品牌故事配图

其中多图字段已支持一次上传多张并追加到当前配置。

## 10. AI 架构

当前 AI 能力分为两块：

1. 图片生成
2. 作品信息建议

工作链路：

```text
后台 AI 配置
   -> AI 生图请求
   -> 第三方模型返回图片地址
   -> 下载到本地 uploads/ai
   -> 人工确认
   -> AI 建议补全文案
   -> 新增或编辑作品
```

当前约束：

- 每次生成 1 张图
- 最多 3 张参考图
- 单张参考图最大 20MB

## 11. 部署架构

### 11.1 默认服务

Docker Compose 默认包含：

- `mysql`
- `backend`
- `web`

### 11.2 运行时镜像构建策略

当前后端运行时镜像已改为在 Docker 构建阶段容器内执行 Maven 打包，而不是依赖宿主机预先准备本地 `target/*.jar`。

这带来的好处：

- 降低“本地 jar 过期导致部署旧版本”的风险
- 让发布链路更可重复
- 更适合标准化交付

### 11.3 一键部署链路

当前支持两条部署主链：

- 源码一键部署：`./deploy.sh`
- 离线发布包部署：`./release-install.sh`

两条链路都支持在新服务器自动补齐 Docker / Compose 基础运行环境。

## 12. 高可用扩展方向

当前版本以单机单实例交付为主，后续扩展建议顺序：

1. 统一反向代理或网关前置
2. Redis 化限流与缓存
3. 后端多实例部署
4. 上传目录迁移对象存储
5. 接入独立日志、监控与告警系统

这样可以保持当前版本易售卖、易部署、易维护，同时不阻塞后续扩容。
