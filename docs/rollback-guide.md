# 回滚说明

## 回滚脚本

推荐使用：

```bash
./rollback.sh --latest --dry-run
```

默认会：

1. 选择指定或最新备份目录
2. 调用 `restore.sh` 恢复数据库和上传文件
3. 重建 `backend + web`
4. 校验 `/api/health` 和首页
5. 记录回滚日志到 `logs/rollbacks/`

## 常用命令

```bash
./rollback.sh --latest --dry-run
./rollback.sh --backup-dir ./backups/20260515-002808 --dry-run
./rollback.sh --backup-dir ./backups/20260515-002808 --yes
```

## 注意事项

- 回滚会覆盖当前数据库和上传文件
- 正式执行前建议先用 `--dry-run`
- 如果要恢复到更早版本，请确认对应备份目录完整可用
