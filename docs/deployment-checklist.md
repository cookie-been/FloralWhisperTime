# 部署前后巡检清单

## 一、部署前检查

上线前至少确认以下内容：

- 已从 `.env.production.example` 生成正式 `.env`
- `MYSQL_PASSWORD`、`MYSQL_ROOT_PASSWORD`、`ADMIN_PASSWORD`、`ADMIN_AUTH_SECRET` 已替换为正式强密码
- `APP_DATA_ENCRYPTION_KEY` 已替换为正式随机值
- `CORS_ALLOWED_ORIGIN_PATTERNS` 已替换为正式域名
- `WEB_PORT` 与服务器端口规划一致
- `BACKUP_DIR` 与服务器持久化目录规划一致
- 如启用 AI 生图，已填写正式 `VOLCENGINE_API_KEY`
- 已按业务预估复核并发保护阈值
  - `PROTECTION_PUBLIC_READ_CAPACITY`
  - `PROTECTION_ADMIN_CAPACITY`
  - `PROTECTION_HEAVY_CAPACITY`
  - `PROTECTION_CONCURRENCY_AI_MAX_CONCURRENT`
  - `PROTECTION_CONCURRENCY_UPLOAD_MAX_CONCURRENT`
  - `PROTECTION_CONCURRENCY_CONFIG_IMPORT_MAX_CONCURRENT`
- 当前代码分支正确，且工作区干净
- 已提前执行一次 `./backup.sh`

## 二、推荐部署命令

生产环境推荐：

```bash
./deploy.sh --env-file .env --branch main --remote origin
```

说明：

- `deploy.sh` 默认会拦截默认弱密码
- 部署后会自动识别 Docker 实际发布的 Web 端口，并执行健康检查与管理员登录自检
- 开发或演示环境如确需跳过弱密码拦截，可显式加：

```bash
./deploy.sh --skip-build --no-git-pull --allow-insecure-env
```

## 三、部署后巡检

### 1. 基础可用性

- 首页可访问
- `/api/health` 返回成功
- 管理后台可登录
- 首次登录改密流程正常
- 后台 `/admin/system` 页面可正常加载
- 当前访问端口与脚本输出的 `Site URL` 一致

### 2. 系统状态页重点检查

- 数据库连接：正常
- 上传目录：存在且可写
- 磁盘容量：无明显不足
- 最近备份：存在
- AI 状态：与当前业务配置一致
- 并发保护状态：已启用且阈值符合当前环境
- 限流 / 繁忙拒绝次数：部署初期无异常快速增长

### 3. 业务关键流程

- 后台上传图片成功
- 作品新增/编辑成功
- 作品逻辑删除与恢复正常
- 留言查看正常
- 留言逻辑删除与恢复正常
- 如启用 AI：
  - 生图可调用
  - 作品信息建议可调用
  - 并发保护触发时返回明确错误提示

## 四、异常时优先排查

### 1. 后台无法登录

- 检查 `.env` 中 `ADMIN_USERNAME`、`ADMIN_PASSWORD`
- 检查浏览器是否仍缓存旧 token

### 2. `/api/health` 不通

- `docker compose ps`
- `docker compose logs --tail=200 backend`
- `docker compose logs --tail=200 web`
- `docker compose logs --tail=200 mysql`

### 3. 系统状态页提示高风险

优先看：

- 数据库是否连通
- 上传目录是否挂载成功
- 磁盘可用容量是否过低
- 备份目录是否存在
- 并发保护拒绝次数是否异常增长
- AI / 上传 / 配置导入阈值是否过低

## 五、上线后建议

- 首次上线当天执行一次完整备份
- 每次升级前执行 `./backup.sh`
- 每次升级后打开 `/admin/system` 做人工复核
- 每次重大配置调整后导出一份配置包留档
- 业务高峰期关注保护状态面板，必要时再调高阈值或增加实例
