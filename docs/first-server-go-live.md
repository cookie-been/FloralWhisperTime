# 新服务器首次上线操作手册

本文档面向“拿到一台全新 Linux 服务器，准备首次部署花语时光正式环境”的场景。

## 1. 目标

完成以下事项：

- 在新服务器安装正式环境
- 初始化正式环境变量
- 启动 Web、Backend、MySQL 容器
- 校验站点首页、后台登录和系统状态
- 完成首次安全初始化

## 2. 服务器前置要求

需要准备：

- Linux 服务器
- 已安装 Docker
- 已安装 Docker Compose
- 开放 `22`
- 若要直接对外提供服务，开放 `80` / `443`

检查命令：

```bash
docker --version
docker compose version
```

## 3. 本地打发布包

在项目根目录执行：

```bash
./release-check.sh
./ops/build-release.sh
```

输出目录默认在：

```text
./tmp/releases
```

会生成：

```text
floralwhispertime-release-<release-id>.tar.gz
floralwhispertime-release-<release-id>.tar.gz.sha256
```

## 4. 上传发布包到服务器

示例：

```bash
scp floralwhispertime-release-<release-id>.tar.gz root@<server-ip>:/tmp/
scp floralwhispertime-release-<release-id>.tar.gz.sha256 root@<server-ip>:/tmp/
```

## 5. 服务器首次安装

登录服务器后执行：

```bash
cd /tmp
sha256sum -c floralwhispertime-release-<release-id>.tar.gz.sha256
tar -xzf floralwhispertime-release-<release-id>.tar.gz
cd floralwhispertime-release-<release-id>
./release-verify.sh
./release-install.sh
```

默认安装目录：

```text
/opt/floralwhispertime
```

## 6. 修改正式环境变量

编辑：

```bash
vim /opt/floralwhispertime/shared/.env
```

至少要修改这些字段：

```dotenv
WEB_PORT=8080

MYSQL_DATABASE=floral_whisper_time
MYSQL_USER=floral_whisper
MYSQL_PASSWORD=替换为正式数据库强密码
MYSQL_ROOT_PASSWORD=替换为正式 root 强密码

ADMIN_USERNAME=admin
ADMIN_PASSWORD=替换为正式后台强密码
ADMIN_AUTH_SECRET=替换为32位以上随机字符串
APP_DATA_ENCRYPTION_KEY=替换为32位以上随机字符串

APP_ENVIRONMENT=production
CORS_ALLOWED_ORIGIN_PATTERNS=https://你的正式域名
PUBLIC_BASE_URL=https://你的正式域名
```

如果启用 AI，再补：

```dotenv
AI_IMAGE_ENABLED=true
VOLCENGINE_API_KEY=你的正式 API Key
VOLCENGINE_IMAGE_MODEL=doubao-seedream-5-0-260128
```

注意：

- `ADMIN_AUTH_SECRET` 和 `APP_DATA_ENCRYPTION_KEY` 不能相同
- 两者都不能保留默认值
- `APP_DATA_ENCRYPTION_KEY` 后续不要随意改动，否则会影响已加密敏感配置的解密

## 7. 应用正式配置

修改 `.env` 后执行：

```bash
cd /tmp/floralwhispertime-release-<release-id>
./release-upgrade.sh
```

## 8. 首次上线后检查

执行：

```bash
./release-status.sh
./release-inspect.sh
```

然后人工检查：

1. 首页能打开
2. 后台登录正常
3. 后台“系统状态”页能打开
4. “系统状态 -> 安全状态”不是高风险
5. 首次登录后已完成管理员改密
6. 上传目录与备份目录正常
7. 如启用 AI，后台 AI 生图配置可正常保存

## 9. 域名与 HTTPS

如果要正式对外使用，建议加 Nginx：

- 域名解析到服务器
- Nginx 监听 `80/443`
- 反向代理到 `127.0.0.1:${WEB_PORT}`
- 配置 HTTPS 证书

参考：

- [nginx-https-production-example.md](./nginx-https-production-example.md)

## 10. 常用运维命令

查看状态：

```bash
./release-status.sh
```

升级：

```bash
./release-upgrade.sh
```

回滚到上一版：

```bash
./release-rollback.sh --latest-previous
```

巡检：

```bash
./release-inspect.sh
```

## 11. 推荐阅读

- [release-package-deployment.md](./release-package-deployment.md)
- [production-env-template.md](./production-env-template.md)
- [nginx-https-production-example.md](./nginx-https-production-example.md)
