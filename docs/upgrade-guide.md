# 升级说明

## 升级脚本

推荐使用：

```bash
./upgrade.sh
```

默认流程：

1. 拉取当前分支最新代码
2. 执行 `backup.sh`
3. 打包 Java 后端
4. 重建并重启 `backend + web`
5. 自动校验 `/api/health` 和首页
6. 记录升级日志到 `logs/upgrades/`

## 常用参数

```bash
./upgrade.sh --skip-git-pull
./upgrade.sh --branch main
./upgrade.sh --skip-backup
./upgrade.sh --skip-build
```

## 注意事项

- 正式环境不建议跳过备份
- 如果 git 工作区不干净，脚本默认会终止
- 升级失败时请先查看 `logs/upgrades/` 和 `docker compose logs`
