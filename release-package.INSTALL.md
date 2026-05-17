# INSTALL

这是花语时光系统的离线镜像发布包安装说明。

## 1. 服务器要求

- Linux
- 可访问公网拉取基础镜像
- 当前用户具备 `root` 或 `sudo` 权限（用于新机自动安装 Docker 运行环境）

说明：

- `release-install.sh` / `release-upgrade.sh` 会在缺少 Docker、Docker Compose、curl 时自动安装
- 当前支持 Debian / Ubuntu / CentOS / RHEL / Rocky / AlmaLinux 常见发行版

## 2. 首次安装

建议先校验发布包：

```bash
sha256sum -c floralwhispertime-release-<release-id>.tar.gz.sha256
```

解压发布包后进入根目录，直接执行：

```bash
./release-verify.sh
./release-install.sh
```

默认会安装到：

```text
/opt/floralwhispertime
```

发布版初始化后的数据库默认是干净状态：

- 不包含演示作品、演示图片、留言和操作日志
- 不包含默认团队成员和默认时间轴条目
- 仅保留必要的系统配置结构与默认管理员登录能力
- 首次交付后需在后台补充站点信息、关于我们、AI 配置和正式业务内容
- 安装过程中如目标机器缺少 Docker 运行环境，脚本会先自动补齐再继续部署

补充说明：

- 首次登录后应立即修改管理员密码
- 首页轮播、登录页轮播、联系页配图等媒体资源也需要按正式内容重新上传

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
- `APP_DATA_ENCRYPTION_KEY`
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
- 发布包解压前可校验外层 `.tar.gz.sha256`
- 解压后可用 `./release-verify.sh` 校验包内文件
- 上传文件目录：`/opt/floralwhispertime/shared/uploads`
- 环境文件：`/opt/floralwhispertime/shared/.env`
- 运行后建议进入后台依次检查：站点配置、AI 生图配置、运维中心、安全状态

更完整说明见仓库文档：

- `docs/release-package-deployment.md`
- `RELEASE_NOTES.md`
- `DELIVERY_CHECKLIST.md`
