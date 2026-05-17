# 离线镜像发布包部署说明

本文档用于说明如何在“本地构建发布包，服务器仅导入业务镜像并一键启动”的模式下部署系统。

如果你当前的目标是“在一台全新服务器上第一次正式上线”，建议优先配合以下文档一起看：

- [first-server-go-live.md](./first-server-go-live.md)
- [production-env-template.md](./templates/production-env-template.md)
- [nginx-https-production-example.md](./reference/nginx-https-production-example.md)

## 1. 适用场景

适合以下场景：

- 客户服务器不方便拉 Git 仓库
- 不希望在客户服务器安装 Maven、Node、npm 等构建依赖
- 需要标准化交付、安装、升级、回滚流程

默认前提：

- 目标服务器为 Linux
- 可访问公网拉取基础镜像
- 同机只部署一套正式环境

当前发布包脚本支持在全新 Linux 服务器上自动安装 Docker 与 Docker Compose，前提是当前用户具备 `root` 或 `sudo` 权限。已覆盖 Debian / Ubuntu / CentOS / RHEL / Rocky / AlmaLinux 常见发行版。

## 2. 本地生成发布包

在当前项目根目录执行：

```bash
./ops.sh release check
./ops/build-release.sh
```

常用参数：

```bash
./ops/build-release.sh --release-id prod-20260515
./ops/build-release.sh --output-dir /tmp/releases
./ops/build-release.sh --skip-build
./ops/build-release.sh --skip-preflight
./ops/build-release.sh --notes-commits 15
```

说明：

- `./ops.sh release check` 用于在正式打包前自检发布链路依赖、关键文件、脚本语法与 release compose 配置
- `./ops/build-release.sh` 默认会自动执行一次同样的 preflight 检查
- `RELEASE_NOTES.md` 会自动写入当前 release 元信息和最近若干条 git 提交摘要
- 只有在你明确知道当前状态时，才建议使用 `--skip-preflight`

输出目录默认是：

```text
./tmp/releases/
```

生成结果示例：

```text
floralwhispertime-release-20260515T120000Z-abc1234.tar.gz
floralwhispertime-release-20260515T120000Z-abc1234.tar.gz.sha256
```

## 3. 发布包内容

发布包内包含：

```text
floralwhispertime-release-<release-id>/
  docker-compose.release.yml
  .env.production.example
  RELEASE_INFO
  RELEASE_NOTES.md
  DELIVERY_CHECKLIST.md
  CHECKSUMS.sha256
  release-check.sh
  release-inspect.sh
  release-install.sh
  release-verify.sh
  release-upgrade.sh
  release-rollback.sh
  release-status.sh
  images/
    backend-image.tar
    web-image.tar
  ops/
    release-check.sh
    release-common.sh
    release-inspect.sh
    release-install.sh
    release-verify.sh
    release-upgrade.sh
    release-rollback.sh
    release-status.sh
```

## 4. 上传到服务器

可使用 `scp`、`rsync`、SFTP 或面板上传到服务器任意临时目录，例如：

```bash
scp floralwhispertime-release-<release-id>.tar.gz user@server:/tmp/
```

建议同时上传对应校验文件：

```bash
scp floralwhispertime-release-<release-id>.tar.gz.sha256 user@server:/tmp/
```

在服务器解压前先校验下载包：

```bash
cd /tmp
sha256sum -c floralwhispertime-release-<release-id>.tar.gz.sha256
```

## 5. 服务器首次安装

### 5.1 解压

```bash
cd /tmp
tar -xzf floralwhispertime-release-<release-id>.tar.gz
cd floralwhispertime-release-<release-id>
```

解压后建议先校验包内文件：

```bash
./ops.sh release verify
```

### 5.2 安装

```bash
./ops.sh release install
```

也可以显式指定保留版本数：

```bash
./ops.sh release install --retain 5
```

脚本默认会使用以下目录：

```text
/opt/floralwhispertime/
  current
  releases/
  shared/
```

首次安装会自动：

- 安装缺失的 Docker / Docker Compose / curl 运行依赖
- 将当前 release 复制到 `/opt/floralwhispertime/releases/<release-id>`
- 初始化 `/opt/floralwhispertime/shared/uploads`
- 初始化 `/opt/floralwhispertime/shared/backups`
- 若不存在，则从 `.env.production.example` 复制生成 `/opt/floralwhispertime/shared/.env`
- 导入 `backend` 与 `web` 业务镜像
- 启动服务并做健康检查

### 5.3 修改正式环境变量

首次安装后，请编辑：

```text
/opt/floralwhispertime/shared/.env
```

至少检查和修改：

- `MYSQL_PASSWORD`
- `MYSQL_ROOT_PASSWORD`
- `ADMIN_PASSWORD`
- `ADMIN_AUTH_SECRET`
- `WEB_PORT`
- `CORS_ALLOWED_ORIGIN_PATTERNS`
- `PUBLIC_BASE_URL`
- `VOLCENGINE_API_KEY`（如启用 AI）

如果首次安装时仍保留默认占位值，建议修改后再执行一次：

```bash
./ops.sh release upgrade
```

也可以在升级时指定保留最近几个 release：

```bash
./ops.sh release upgrade --retain 5
```

## 6. 后续升级

将新的 release 包上传并解压后，在新 release 目录执行：

```bash
./ops.sh release upgrade
```

升级流程：

- 自动补齐缺失的 Docker / Docker Compose / curl 运行依赖
- 导入新业务镜像
- 复用 `/opt/floralwhispertime/shared/.env`
- 使用新 release 的 compose 文件重建服务
- 健康检查通过后更新 `current`
- 自动清理超出保留数量的旧 release 目录

## 7. 回滚

回滚到上一个 release：

```bash
./ops.sh release rollback --latest-previous
```

回滚到指定 release：

```bash
./ops.sh release rollback --release-id <release-id>
```

回滚不会删除：

- MySQL volume
- `/opt/floralwhispertime/shared/.env`
- `/opt/floralwhispertime/shared/uploads`
- `/opt/floralwhispertime/shared/backups`

说明：

- 默认保留最近 `5` 个 release（含当前版本）
- 可通过 `--retain` 调整保留数量
- 只清理旧 release 目录，不会删除 MySQL volume 和共享目录

## 8. 查看状态

```bash
./ops.sh release status
```

会输出：

- 当前激活 release
- git revision
- backend / web 镜像 tag
- compose 容器状态
- `/api/health` 检查结果

## 9. 部署后巡检

部署完成后可单独执行：

```bash
./ops.sh release inspect
```

会检查：

- compose 容器状态
- `/api/health`
- 首页可访问性
- 后台管理员登录
- `/api/admin/system/status`

适合交付现场、升级后复核和客户自助巡检。

## 10. 目录说明

服务器最终目录结构：

```text
/opt/floralwhispertime/
  current -> /opt/floralwhispertime/releases/<release-id>
  releases/
    <release-id>/
  shared/
    .env
    uploads/
    backups/
```

说明：

- `releases/` 保存每次发布内容
- `current` 指向当前激活版本
- `shared/` 保存跨版本共享的配置和文件

## 11. 常见问题

### 10.1 为什么发布包很大？

因为它包含了业务镜像 tar，这样服务器无需重新构建镜像。

### 10.2 为什么不用 Git 部署？

离线发布包模式是为了降低客户环境依赖，避免把仓库访问、源码构建、构建缓存等问题带到客户服务器上。

### 10.3 数据库存哪里？

MySQL 数据仍存放在 Docker volume `floral_whisper_mysql` 中，不在 release 包目录里。

### 10.4 上传文件存哪里？

上传文件在：

```text
/opt/floralwhispertime/shared/uploads
```

### 10.5 如何改默认安装目录？

可给 release 脚本传：

```bash
--app-root /your/path
```
