# 花语时光鲜花店展示系统

这是一个面向鲜花门店与花艺工作室的品牌展示系统，包含：

- PC Web 前台
- PC Web 管理后台
- 微信小程序前台
- Java + MySQL 后端

当前默认部署基线为企业级三层结构：

- `mysql`：MySQL 8，持久化存储
- `flower-shop-backend-java`：Spring Boot 3 + Spring Security + MyBatis-Plus + Flyway
- `flower-shop-web`：Nginx 托管静态站点并反向代理 `/api` 与 `/uploads`

## 目录

- `flower-shop-backend-java/`：Java 主线后端
- `flower-shop-web/`：React + TypeScript + Vite + Ant Design Web
- `flower-shop-mini/`：微信小程序原生工程
- `shared/`：Web 共享类型与数据结构
- `scripts/catalog/`：作品批量生成与导入脚本
- `ops/`：部署、升级、备份、恢复、回滚脚本实现目录
- `logo/`：品牌 Logo 原始文件
- `docs/`：正式产品、架构、接口与运维文档

## 先看这里

如果你现在觉得文档和脚本有点多，先看这两个入口：

- [docs/start-here.md](/workspace/FloralWhisperTime/docs/start-here.md)
- [docs/README.md](/workspace/FloralWhisperTime/docs/README.md)

日常优先只需要记一个统一入口 `./ops.sh`，不需要先记 `ops/` 里的实现脚本。旧的根目录脚本仍保留兼容。

## 最终推荐使用方式

如果你是最终客户、实施人员、售后同事或日常运维，建议只按下面这套方式使用：

- 部署、升级、回滚、备份、恢复：优先使用 `./ops.sh`
- 后台管理中的运维中心：只执行低风险动作，如备份、巡检、归档、配置导入导出
- 高风险链路：如部署、升级、回滚、release 切换，仍在 Linux / Docker 环境通过命令行执行
- 查文档时：优先从 [docs/start-here.md](/workspace/FloralWhisperTime/docs/start-here.md) 和 [docs/README.md](/workspace/FloralWhisperTime/docs/README.md) 进入

## 一键部署

推荐直接使用统一入口脚本：

```bash
./ops.sh deploy
```

脚本会自动：

- 从当前 git 远程拉取最新代码（默认 `origin` 和当前分支）
- 首次根据 `.env.example` 生成 `.env`
- 在全新 Linux 服务器缺少 `docker`、`docker compose`、`curl`、`python3`、`maven` 时自动安装运行依赖
- 自动生成数据库密码、管理员密码、签名密钥
- 校验生产环境关键配置，阻止默认弱密码直接上线
- 创建上传目录
- 从源码构建前端与 Java 后端镜像
- 启动 `mysql + backend + web`
- 自动读取 Docker 实际发布的 Web 端口，并验证 `/api/health`、首页，以及可用时的管理员登录和系统状态接口

常用参数：

```bash
./ops.sh deploy --env-file .env.production --web-port 8081
./ops.sh deploy --project-name floralwhispertime-prod
./ops.sh deploy --project-name floralwhispertime-staging --env-file .env.staging --web-port 18080
./ops.sh deploy --env-file .env.production --env-template .env.production.example
./ops.sh deploy --branch main
./ops.sh deploy --remote origin --branch main
./ops.sh deploy --no-git-pull
./ops.sh deploy --pull
./ops.sh deploy --skip-build
./ops.sh deploy --allow-insecure-env
./ops.sh deploy --skip-runtime-install
```

说明：

- 默认会阻止使用 `.env.example` 中的默认弱密码直接部署
- 仅开发或演示环境可使用 `--allow-insecure-env` 显式跳过这层保护
- 默认支持在 Debian / Ubuntu / CentOS / RHEL / Rocky / AlmaLinux 新机上自动补齐 Docker 运行环境
- 自动安装依赖时需要当前用户具备 `root` 或 `sudo` 权限；若不希望脚本安装系统依赖，可显式传 `--skip-runtime-install`
- 生产环境必须显式配置 `APP_DATA_ENCRYPTION_KEY`，且 `CORS_ALLOWED_ORIGIN_PATTERNS` 不应保留 `*`
- 如果管理员已经在后台修改过密码，数据库中的管理员密码哈希会优先于 `.env` 中的 `ADMIN_PASSWORD`；此时部署脚本会给出告警，但不会再把健康发布误判为失败
- 生产环境建议基于 `.env.production.example` 生成正式 `.env`
- 如果同一台机器需要并行跑测试、预发、正式多套环境，建议显式传 `--project-name`，避免复用默认 compose 容器名、网络名和数据卷
- 环境变量说明可参考 [docs/reference/env-reference.md](/workspace/FloralWhisperTime/docs/reference/env-reference.md)
- 部署前后可按 [docs/deployment-checklist.md](/workspace/FloralWhisperTime/docs/deployment-checklist.md) 执行人工巡检
- 如需接入企业域名与 HTTPS 入口，可参考 [docs/reference/nginx-https-example.md](/workspace/FloralWhisperTime/docs/reference/nginx-https-example.md)
- 正式文档索引见 [docs/README.md](/workspace/FloralWhisperTime/docs/README.md)

脚本说明：

- `./ops.sh` 是统一公开入口
- 旧的根目录脚本仍保留兼容，可继续使用
- `ops/` 目录下同名脚本是实现层
- 普通部署、备份、升级、回滚优先使用 `./ops.sh`

## 离线镜像发布部署

如果目标服务器不方便拉取 Git 仓库，或希望以标准化交付包方式部署，推荐使用离线镜像发布包模式：

```bash
./ops.sh release check
./ops/build-release.sh
```

脚本会在 `./tmp/releases/` 生成一个发布包，内部包含：

- 后端镜像 tar
- Web 镜像 tar
- 发布版 `docker-compose.release.yml`
- 发布前自检入口脚本
- 发布包与包内文件校验脚本
- 服务器端安装、升级、回滚、状态脚本
- `RELEASE_NOTES.md` 版本说明
- `DELIVERY_CHECKLIST.md` 交付清单
- `.env.production.example`
- `RELEASE_INFO`

发布包默认数据库为干净交付态：

- 保留系统运行所需的基础分类、AI 配置单例和站点基础单例结构
- 不预置演示作品、演示图片、演示团队、演示时间轴、留言和操作日志
- 默认仅保留管理员登录能力，账号由环境变量控制，默认账号为 `admin`
- 发布包安装/升级脚本也会在全新 Linux 服务器上自动补齐 Docker 与 Compose 运行环境

将发布包上传到目标服务器后，按文档执行：

- 首次安装：`./ops.sh release install`
- 后续升级：`./ops.sh release upgrade`
- 回滚：`./ops.sh release rollback`
- 状态查看：`./ops.sh release status`
- 部署后巡检：`./ops.sh release inspect`

release 脚本默认会保留最近 `5` 个版本目录，超出的旧 release 会在安装或升级成功后自动清理。

完整说明见 [docs/release-package-deployment.md](/workspace/FloralWhisperTime/docs/release-package-deployment.md)。

## 备份

推荐使用统一入口脚本：

```bash
./ops.sh backup
```

默认会备份：

- MySQL 数据库
- `flower-shop-backend-java/uploads/` 上传文件

备份目录默认在：

```text
./backups/<timestamp>/
```

## 升级

推荐使用统一入口脚本：

```bash
./ops.sh upgrade
```

默认会先执行备份，再拉取代码、重建容器并做健康检查。

## 回滚

推荐使用统一入口脚本：

```bash
./ops.sh rollback --latest --dry-run
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
- `/admin/system`：运维中心
- `/admin/operation-logs`：操作日志

其中：

- `站点配置` 统一维护首页、门店信息、品牌故事、关于我们、后台文案和媒体资源
- `站点配置` 页面内部采用 `Tabs` 切换，按 `首页与品牌 / 门店与联系 / 品牌故事 / 关于我们 / 后台文案 / 媒体资源` 分组维护
- 首页统计数据不再人工配置，前台直接读取系统真实数据并按分页聚合全部作品
- `AI 生图配置` 独立维护生图开关、密钥、模型与接口参数
- `操作日志` 用于审计后台写操作并按历史快照恢复误操作数据
- 前后台统一使用 `logo/` 目录导出的品牌 Logo 作为站点 Logo 与浏览器标签图标
- Web 前端对公开站点数据和少量后台只读配置做了短时内存缓存，并在后台写操作后自动失效，用于减少重复请求与切页等待
- 作品、留言、关于我们时间轴和团队成员已支持逻辑删除与恢复

`运维中心` 页面用于查看和执行：

- 当前部署版本
- 当前部署提交号与部署时间
- 数据库连通状态
- 数据库版本与容量
- 磁盘总量、可用量、已用比例
- 上传目录状态与文件数
- 上传目录容量
- 服务运行时长
- AI 配置启用情况
- 手动备份与系统巡检
- 最近后台触发的运维任务记录
- 最近一次备份目录与时间
- 最近备份一键下载
- 配置导出与导入
- 操作日志归档与归档文件下载
- 一键刷新与风险分级提示
- 最近刷新时间与自动轮询开关
- 连续刷新失败次数、最近错误与自动轮询暂停提示
- 限流阈值、并发阈值、已触发限流次数与繁忙拒绝次数

`作品管理` 已支持 AI 生成作品图工作流：

- 自由输入 prompt
- 支持最多 3 张参考图
- 单张最大 20MB
- 每次生成 1 张图
- 生成图下载到本地 `uploads/ai/`
- 人工审核后再进入新增作品流程
- 可继续调用 AI 作品信息建议补全名称、花材、标签、寓意等信息

## 数据与安全

当前版本已补齐以下交付级基础能力：

- Spring Security + JWT Bearer Token 后台鉴权
- 首次登录强制修改管理员密码
- 管理员密码落库后使用 BCrypt 存储
- `ADMIN_AUTH_SECRET` 控制 JWT 密钥
- `APP_DATA_ENCRYPTION_KEY` 控制数据加密密钥
- 操作日志审计与按快照恢复
- 逻辑删除与回收恢复
- 全站基础限流
- 管理后台更严格限流
- AI / 上传 / 配置导入并发隔离

说明：

- 公开读取接口默认允许访问
- 写接口如 `POST /api/uploads`、`POST/PUT/DELETE /api/flowers`、`PUT /api/site-config` 当前都要求管理员身份

## 部署链路说明

当前后端运行时镜像已改为在 Docker 构建过程中容器内执行 Maven 打包，而不是依赖宿主机已有的 `target/*.jar`。

这样可以避免：

- 本地 jar 过期导致部署旧版本
- 构建产物与源码版本不一致
- 客户服务器部署链路不稳定

## 环境变量

环境变量请统一以以下文档为准：

- [生产环境变量说明](/workspace/FloralWhisperTime/docs/reference/env-reference.md)
- [安装手册](/workspace/FloralWhisperTime/docs/installation-guide.md)

生产环境必须至少替换默认密码、JWT 密钥、数据加密密钥，并按当前访问规模复核并发保护阈值。

## 功能范围

当前版本支持品牌和花束作品展示、作品分类、搜索、排序、详情、相关推荐、关于我们、门店信息、地图、联系留言，以及 Web 管理后台的作品管理、站点配置、AI 生图配置、留言查看、运维中心、操作日志与按快照恢复。不包含购物车、支付、订单、库存和会员系统。
