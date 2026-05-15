# 安装手册

本文档面向交付后的部署人员，说明如何在 Linux + Docker 环境中完成首装。

## 1. 环境要求

- Linux 服务器
- Docker 与 Docker Compose
- Git
- 可访问外网镜像源
- 至少 2 CPU / 4 GB 内存

建议：

- 生产环境使用独立云服务器或虚拟机
- 站点域名与 HTTPS 反向代理由 Nginx 或网关统一接入

## 2. 获取项目

```bash
git clone <your-repository-url>
cd FloralWhisperTime
```

如果交付的是压缩包，直接解压后进入项目根目录即可。

## 3. 初始化环境文件

推荐从生产模板生成：

```bash
cp .env.production.example .env
```

然后至少修改以下字段：

- `MYSQL_PASSWORD`
- `MYSQL_ROOT_PASSWORD`
- `ADMIN_PASSWORD`
- `ADMIN_AUTH_SECRET`
- `CORS_ALLOWED_ORIGIN_PATTERNS`
- `WEB_PORT`
- `VOLCENGINE_API_KEY`（如启用 AI）
- `PROTECTION_PUBLIC_READ_CAPACITY`
- `PROTECTION_ADMIN_CAPACITY`
- `PROTECTION_HEAVY_CAPACITY`
- `PROTECTION_CONCURRENCY_AI_MAX_CONCURRENT`
- `PROTECTION_CONCURRENCY_UPLOAD_MAX_CONCURRENT`
- `PROTECTION_CONCURRENCY_CONFIG_IMPORT_MAX_CONCURRENT`

详细说明见 [env-reference.md](./env-reference.md)。

## 4. 首次部署

执行：

```bash
./deploy.sh --env-file .env --branch main --remote origin
```

如果同机需要并行部署多套环境，建议显式指定项目名：

```bash
./deploy.sh --project-name floralwhispertime-prod --env-file .env --branch main --remote origin
./deploy.sh --project-name floralwhispertime-staging --env-file .env.staging --web-port 18080 --no-git-pull
```

脚本会自动：

- 拉取最新代码
- 构建前后端镜像
- 启动 `mysql + backend + web`
- 写入当前部署提交号与部署时间
- 校验健康检查与后台登录

说明：

- 未指定 `--project-name` 时，Docker Compose 会使用默认项目名，容器、网络和数据卷也会共用该命名空间
- 在测试部署、预发部署、正式部署并存的场景下，应固定不同的 `--project-name`

当前版本默认还会带上：

- 全站基础限流
- 管理后台更严格限流
- AI / 上传 / 配置导入并发隔离
- 公开只读接口本地缓存

## 5. 安装后确认

至少确认：

- `Site URL` 可访问
- `/api/health` 正常
- 后台能登录
- `/admin/system` 可看到版本、环境、提交号、部署时间
- `/admin/system` 可看到并发保护阈值与拒绝次数

巡检清单见 [deployment-checklist.md](./deployment-checklist.md)。

## 6. 常见运维命令

```bash
./backup.sh
./upgrade.sh
./rollback.sh --latest --dry-run
./restore.sh --latest --dry-run
```

实际脚本主目录为 `ops/`，根目录命令为兼容入口。

## 7. 升级建议

- 升级前先执行 `./backup.sh`
- 正式升级使用 `./upgrade.sh`
- 升级后查看后台系统状态页
- 如本次业务量明显提升，复核并发保护阈值是否仍合适

## 8. 回滚建议

- 回滚前先用 `--dry-run`
- 确认目标备份包含数据库和上传文件
- 正式回滚后再次检查首页和后台
