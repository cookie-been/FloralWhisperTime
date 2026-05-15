# 花语时光鲜花店展示系统

这是一个鲜花店品牌展示系统，包含：

- PC Web 前台
- PC Web 管理后台
- 微信小程序
- Java + MySQL 后端

当前默认部署基线为企业级三层结构：

- `mysql`：MySQL 8，持久化存储
- `flower-shop-backend-java`：Spring Boot 3 + MyBatis-Plus + Flyway
- `flower-shop-web`：Nginx 托管静态站点并反向代理 `/api` 与 `/uploads`

`flower-shop-backend/` 仍保留为历史兼容版 Node/Express 后端，但不是默认运行主线。

## 目录

- `flower-shop-backend-java/`：Java 主线后端
- `flower-shop-web/`：React + TypeScript + Vite + Ant Design Web
- `flower-shop-mini/`：微信小程序原生工程
- `flower-shop-backend/`：历史兼容 Node/Express 后端
- `shared/`：Web 共享类型与数据结构
- `scripts/catalog/`：作品批量生成与导入脚本
- `logo/`：品牌 Logo 原始文件
- `docs/superpowers/`：设计、计划、迁移与验收文档

## 一键部署

推荐直接使用仓库根目录脚本：

```bash
./deploy.sh
```

脚本会自动：

- 从当前 git 远程拉取最新代码（默认 `origin` 和当前分支）
- 首次根据 `.env.example` 生成 `.env`
- 自动生成数据库密码、管理员密码、签名密钥
- 校验生产环境关键配置，阻止默认弱密码直接上线
- 创建上传目录
- 从源码构建前端与 Java 后端镜像
- 启动 `mysql + backend + web`
- 自动读取 Docker 实际发布的 Web 端口，并验证 `/api/health`、首页、管理员登录和系统状态接口

常用参数：

```bash
./deploy.sh --env-file .env.production --web-port 8081
./deploy.sh --env-file .env.production --env-template .env.production.example
./deploy.sh --branch main
./deploy.sh --remote origin --branch main
./deploy.sh --no-git-pull
./deploy.sh --pull
./deploy.sh --skip-build
./deploy.sh --allow-insecure-env
```

说明：

- 默认会阻止使用 `.env.example` 中的默认弱密码直接部署
- 仅开发或演示环境可使用 `--allow-insecure-env` 显式跳过这层保护
- 生产环境建议基于 `.env.production.example` 生成正式 `.env`
- 部署前后可按 [docs/deployment-checklist.md](/workspace/FloralWhisperTime/docs/deployment-checklist.md) 执行人工巡检
- 如需接入企业域名与 HTTPS 入口，可参考 [docs/nginx-https-example.md](/workspace/FloralWhisperTime/docs/nginx-https-example.md)

## 备份

推荐使用根目录脚本：

```bash
./backup.sh
```

默认会备份：

- MySQL 数据库
- `flower-shop-backend-java/uploads/` 上传文件

备份目录默认在：

```text
./backups/<timestamp>/
```

## 升级

推荐使用根目录脚本：

```bash
./upgrade.sh
```

默认会先执行备份，再拉取代码、重建容器并做健康检查。

## 回滚

推荐使用根目录脚本：

```bash
./rollback.sh --latest --dry-run
```

建议先用 `--dry-run` 校验目标备份，再执行正式回滚。

说明：

- 默认会先执行 `git fetch` + `git pull --ff-only`
- 如果本地 git 工作区不干净，脚本会停止，避免把本地修改直接冲掉
- 确认需要跳过这层保护时，可显式传 `--allow-dirty-git`

默认访问地址通常为 `http://localhost:8080`。如果部署时改了 `WEB_PORT` 或出现端口调整，以脚本输出的 `Site URL` 为准。

## Docker 部署

也可以手动执行：

```bash
docker compose up -d --build
```

持久化策略：

- MySQL 数据：Docker volume `floral_whisper_mysql`
- 上传文件：`flower-shop-backend-java/uploads:/app/uploads`

浏览器只需要访问 Web 端口。Web 容器会把 `/api` 和 `/uploads` 反向代理到 Java 后端容器。

完整容器验收手册见 [docs/superpowers/migration-checklists/2026-05-13-docker-cutover-runbook.md](/workspace/FloralWhisperTime/docs/superpowers/migration-checklists/2026-05-13-docker-cutover-runbook.md)。

## 本地开发

### Java 后端

```bash
cd flower-shop-backend-java
mvn spring-boot:run
```

默认服务地址：`http://localhost:3001`

### Web

```bash
cd flower-shop-web
npm install
npm run dev
```

本地开发时，Web 默认请求 `http://localhost:3001`。如需修改，可设置 `VITE_API_BASE_URL`。

### 小程序

使用微信开发者工具导入 `flower-shop-mini`。

小程序默认请求 `flower-shop-mini/config/api.ts` 中的 `http://localhost:3001`。真机预览时请改成局域网 IP 或正式 HTTPS 域名，并在微信小程序后台配置 request 合法域名。

## 管理后台

当前后台包含七个一级入口：

- `/admin`：运营总览
- `/admin/flowers`：作品管理
- `/admin/settings`：站点配置
- `/admin/ai-settings`：AI 生图配置
- `/admin/contacts`：用户留言
- `/admin/system`：系统状态
- `/admin/operation-logs`：操作日志

其中：

- `站点配置` 统一维护首页首屏、门店信息、品牌故事和关于我们内容
- 首页统计数据不再人工配置，前台直接读取系统真实数据并按分页聚合全部作品
- `AI 生图配置` 独立维护生图开关、密钥、模型与接口参数
- `操作日志` 用于审计后台写操作并按历史快照恢复误操作数据
- 前后台统一使用 `logo/` 目录导出的品牌 Logo 作为站点 Logo 与浏览器标签图标

`系统状态` 页面用于查看：

- 当前部署版本
- 数据库连通状态
- 数据库版本与容量
- 磁盘总量、可用量、已用比例
- 上传目录状态与文件数
- 上传目录容量
- 服务运行时长
- AI 配置启用情况
- 最近一次备份目录与时间
- 最近备份一键下载
- 一键刷新与风险分级提示
- 最近刷新时间与自动轮询开关
- 连续刷新失败次数、最近错误与自动轮询暂停提示

`作品管理` 已支持 AI 生成作品图工作流：

- 自由输入 prompt
- 支持最多 3 张参考图
- 单张最大 20MB
- 每次生成 1 张图
- 生成图下载到本地 `uploads/ai/`
- 人工审核后再进入新增作品流程

## 关键环境变量

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
- `BACKUP_DIR`
- `AI_IMAGE_ENABLED`
- `VOLCENGINE_API_KEY`
- `VOLCENGINE_IMAGE_MODEL`
- `VOLCENGINE_BASE_URL`
- `VOLCENGINE_IMAGE_GENERATE_PATH`
- `AI_IMAGE_MAX_REFERENCE_FILES`
- `AI_IMAGE_MAX_REFERENCE_FILE_SIZE_BYTES`
- `AI_IMAGE_DOWNLOAD_SUBDIR`
- `AI_IMAGE_REQUEST_TIMEOUT_SECONDS`
- `AI_IMAGE_SIZE`
- `AI_IMAGE_RESPONSE_FORMAT`
- `AI_IMAGE_WATERMARK`

生产环境必须替换默认密码和签名密钥。

## 功能范围

当前版本支持品牌和花束作品展示、作品分类、搜索、排序、详情、相关推荐、关于我们、门店信息、地图、联系留言，以及 Web 管理后台的作品管理、站点配置、AI 生图配置、留言查看、系统状态、操作日志与按快照恢复。不包含购物车、支付、订单、库存和会员系统。
