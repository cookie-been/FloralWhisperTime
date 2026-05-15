# 离线镜像发布包部署说明

本文档用于说明如何在“本地构建发布包，服务器仅导入业务镜像并一键启动”的模式下部署系统。

## 1. 适用场景

适合以下场景：

- 客户服务器不方便拉 Git 仓库
- 不希望在客户服务器安装 Maven、Node、npm 等构建依赖
- 需要标准化交付、安装、升级、回滚流程

默认前提：

- 目标服务器为 Linux
- 已安装 Docker 与 Docker Compose
- 可访问公网拉取基础镜像
- 同机只部署一套正式环境

## 2. 本地生成发布包

在当前项目根目录执行：

```bash
./ops/build-release.sh
```

常用参数：

```bash
./ops/build-release.sh --release-id prod-20260515
./ops/build-release.sh --output-dir /tmp/releases
./ops/build-release.sh --skip-build
```

输出目录默认是：

```text
./tmp/releases/
```

生成结果示例：

```text
floralwhispertime-release-20260515T120000Z-abc1234.tar.gz
```

## 3. 发布包内容

发布包内包含：

```text
floralwhispertime-release-<release-id>/
  docker-compose.release.yml
  .env.production.example
  RELEASE_INFO
  release-install.sh
  release-upgrade.sh
  release-rollback.sh
  release-status.sh
  images/
    backend-image.tar
    web-image.tar
  ops/
    release-common.sh
    release-install.sh
    release-upgrade.sh
    release-rollback.sh
    release-status.sh
```

## 4. 上传到服务器

可使用 `scp`、`rsync`、SFTP 或面板上传到服务器任意临时目录，例如：

```bash
scp floralwhispertime-release-<release-id>.tar.gz user@server:/tmp/
```

## 5. 服务器首次安装

### 5.1 解压

```bash
cd /tmp
tar -xzf floralwhispertime-release-<release-id>.tar.gz
cd floralwhispertime-release-<release-id>
```

### 5.2 安装

```bash
./release-install.sh
```

也可以显式指定保留版本数：

```bash
./release-install.sh --retain 5
```

脚本默认会使用以下目录：

```text
/opt/floralwhispertime/
  current
  releases/
  shared/
```

首次安装会自动：

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
./release-upgrade.sh
```

也可以在升级时指定保留最近几个 release：

```bash
./release-upgrade.sh --retain 5
```

## 6. 后续升级

将新的 release 包上传并解压后，在新 release 目录执行：

```bash
./release-upgrade.sh
```

升级流程：

- 导入新业务镜像
- 复用 `/opt/floralwhispertime/shared/.env`
- 使用新 release 的 compose 文件重建服务
- 健康检查通过后更新 `current`
- 自动清理超出保留数量的旧 release 目录

## 7. 回滚

回滚到上一个 release：

```bash
./release-rollback.sh --latest-previous
```

回滚到指定 release：

```bash
./release-rollback.sh --release-id <release-id>
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
./release-status.sh
```

会输出：

- 当前激活 release
- git revision
- backend / web 镜像 tag
- compose 容器状态
- `/api/health` 检查结果

## 9. 目录说明

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

## 10. 常见问题

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
