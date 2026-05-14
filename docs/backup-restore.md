# 备份与恢复说明

## 备份

推荐使用仓库根目录脚本：

```bash
./backup.sh
```

脚本默认会：

- 读取 `.env`
- 连接当前 Docker Compose 中的 `mysql`
- 导出业务数据库为 `mysql.sql.gz`
- 打包 `flower-shop-backend-java/uploads/` 为 `uploads.tar.gz`
- 生成 `metadata.txt`
- 将备份保存到 `./backups/<时间戳>/`
- 默认仅保留最近 7 份备份

常用参数：

```bash
./backup.sh --retain 14
./backup.sh --output-dir /data/floral-backups
./backup.sh --env-file .env.production
```

## 备份产物

每份备份目录包含：

- `mysql.sql.gz`
- `uploads.tar.gz`
- `metadata.txt`

## 恢复

恢复脚本：

```bash
./restore.sh --latest --dry-run
```

建议先用 `--dry-run` 校验备份包结构和恢复目标，再执行正式恢复。

常用命令：

```bash
./restore.sh --latest --dry-run
./restore.sh --backup-dir ./backups/20260515-002808 --dry-run
./restore.sh --backup-dir ./backups/20260515-002808 --yes
```

说明：

- 正式恢复会覆盖当前数据库和 `uploads`
- 恢复完成后会自动做一次 `/api/health` 检查
- 建议恢复前先确认当前数据已不再需要，或先额外执行一次 `./backup.sh`
