# 脚本与命令总览

本文档用于把“根目录入口脚本”和“`ops/` 实现脚本”分层说明，减少认知负担。

## 1. 结论先说

日常只记根目录入口脚本：

- `./deploy.sh`
- `./backup.sh`
- `./upgrade.sh`
- `./rollback.sh`
- `./restore.sh`
- `./release-check.sh`
- `./release-install.sh`
- `./release-upgrade.sh`
- `./release-rollback.sh`
- `./release-status.sh`
- `./release-inspect.sh`
- `./release-verify.sh`

`ops/` 目录下同名脚本是实现层，不是给日常使用者优先记的。

## 2. 根目录脚本的定位

根目录脚本相当于对外统一入口。

例如：

- `./deploy.sh` 实际转发到 `ops/deploy.sh`
- `./backup.sh` 实际转发到 `ops/backup.sh`
- `./upgrade.sh` 实际转发到 `ops/upgrade.sh`

这样做的目的：

- 让客户和实施只记根目录入口
- 保持调用方式稳定
- 允许内部实现继续在 `ops/` 演进

## 3. 推荐记忆方式

### 3.1 源码部署链

只记：

```bash
./deploy.sh
./backup.sh
./upgrade.sh
./rollback.sh
./restore.sh
```

### 3.2 release 离线包链

只记：

```bash
./release-check.sh
./release-install.sh
./release-upgrade.sh
./release-rollback.sh
./release-status.sh
./release-inspect.sh
./release-verify.sh
```

## 4. 脚本分类

### 4.1 部署类

- `deploy.sh`
- `release-install.sh`

### 4.2 备份恢复类

- `backup.sh`
- `restore.sh`
- `rollback.sh`
- `release-rollback.sh`

### 4.3 升级类

- `upgrade.sh`
- `release-upgrade.sh`

### 4.4 巡检与状态类

- `release-check.sh`
- `release-status.sh`
- `release-inspect.sh`
- `release-verify.sh`

## 5. 什么时候才需要看 `ops/`

只有在这些场景下才建议直接看 `ops/`：

- 你要改脚本实现
- 你要排查脚本内部逻辑
- 你要扩展部署能力
- 你是开发或高级实施人员

正常客户、运营、普通实施不需要优先进入 `ops/`。

## 6. Docker 与 Compose 文件怎么理解

最常用的文件只有：

- `docker-compose.yml`
- `docker-compose.release.yml`
- `flower-shop-backend-java/Dockerfile.runtime`
- `flower-shop-web/Dockerfile.runtime`

理解方式：

- `docker-compose.yml`：源码部署默认编排
- `docker-compose.release.yml`：release 包部署默认编排
- `Dockerfile.runtime`：正式运行镜像构建文件

## 7. 最低记忆集

如果你只想记最少内容，只记：

### 部署

```bash
./deploy.sh
```

### 备份

```bash
./backup.sh
```

### 升级

```bash
./upgrade.sh
```

### 回滚

```bash
./rollback.sh --latest --dry-run
```

### release 安装

```bash
./release-install.sh
```

## 8. 建议配合阅读

- [从这里开始](./start-here.md)
- [客户交付快速开始](./customer-delivery-quick-start.md)
- [运维 SOP 手册](./operations-sop.md)
