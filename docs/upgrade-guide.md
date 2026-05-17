# 升级说明

## 升级脚本

推荐使用：

```bash
./ops.sh upgrade
```

默认流程：

1. 拉取当前分支最新代码
2. 执行 `ops.sh backup`
3. 重建前后端运行镜像
4. 重建并重启 `backend + web`
5. 自动识别 Docker 实际发布的 Web 端口
6. 自动校验 `/api/health` 和首页
7. 记录升级日志到 `logs/upgrades/`

补充说明：

- 当前后端运行时镜像会在 Docker 构建阶段容器内执行 Maven 打包
- 升级时不再依赖宿主机预先准备本地 `target/*.jar`

## 常用参数

```bash
./ops.sh upgrade --skip-git-pull
./ops.sh upgrade --branch main
./ops.sh upgrade --skip-backup
./ops.sh upgrade --skip-build
```

## 注意事项

- 正式环境不建议跳过备份
- 如果 git 工作区不干净，脚本默认会终止
- 升级完成后访问地址以脚本输出的 `Site URL` 为准
- 升级失败时请先查看 `logs/upgrades/` 和 `docker compose logs`
- 升级后建议优先检查后台登录、作品管理、站点配置和运维中心
