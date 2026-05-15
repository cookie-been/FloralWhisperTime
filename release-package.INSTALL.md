# INSTALL

这是花语时光系统的离线镜像发布包安装说明。

## 1. 服务器要求

- Linux
- Docker
- Docker Compose
- 可访问公网拉取基础镜像

## 2. 首次安装

解压发布包后进入根目录，直接执行：

```bash
./release-install.sh
```

默认会安装到：

```text
/opt/floralwhispertime
```

如果要改安装目录：

```bash
./release-install.sh --app-root /your/path
```

## 3. 修改正式配置

首次安装后，编辑：

```text
/opt/floralwhispertime/shared/.env
```

至少检查这些字段：

- `MYSQL_PASSWORD`
- `MYSQL_ROOT_PASSWORD`
- `ADMIN_PASSWORD`
- `ADMIN_AUTH_SECRET`
- `WEB_PORT`
- `CORS_ALLOWED_ORIGIN_PATTERNS`
- `PUBLIC_BASE_URL`

修改完成后执行：

```bash
./release-upgrade.sh
```

## 4. 常用命令

升级：

```bash
./release-upgrade.sh
```

回滚到上一个版本：

```bash
./release-rollback.sh --latest-previous
```

查看状态：

```bash
./release-status.sh
```

部署后巡检：

```bash
./release-inspect.sh
```

## 5. 说明

- 默认保留最近 `5` 个 release
- 上传文件目录：`/opt/floralwhispertime/shared/uploads`
- 环境文件：`/opt/floralwhispertime/shared/.env`

更完整说明见仓库文档：

- `docs/release-package-deployment.md`
