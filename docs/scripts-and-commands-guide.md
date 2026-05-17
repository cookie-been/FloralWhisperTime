# 脚本与命令总览

本文档用于把“统一入口脚本”“根目录兼容脚本”和“`ops/` 实现脚本”分层说明，减少认知负担。

## 1. 结论先说

日常优先只记统一入口脚本：

- `./ops.sh`

旧的根目录脚本仍然保留兼容，但已经不再是首选记忆入口。`ops/` 目录下同名脚本是实现层，不是给日常使用者优先记的。

## 2. 三层结构怎么理解

### 2.1 第一层：统一入口

- `./ops.sh` 是最推荐的对外统一入口
- 适合客户、实施、运维、售后直接记忆

例如：

- `./ops.sh deploy`
- `./ops.sh backup`
- `./ops.sh release install`

### 2.2 第二层：根目录兼容脚本

根目录兼容脚本仍然存在，主要用于：

- 兼容旧文档
- 兼容已有操作习惯
- 兼容外部调用脚本

例如：

- `./deploy.sh` 实际转发到 `./ops.sh deploy`
- `./backup.sh` 实际转发到 `./ops.sh backup`
- `./upgrade.sh` 实际转发到 `./ops.sh upgrade`

### 2.3 第三层：`ops/` 实现层

`ops/` 目录下脚本才是真正的实现层。

这样做的目的：

- 让客户和实施只记统一入口
- 保持调用方式稳定
- 允许内部实现继续在 `ops/` 演进

## 3. 推荐记忆方式

### 3.1 源码部署链

只记：

```bash
./ops.sh deploy
./ops.sh backup
./ops.sh upgrade
./ops.sh rollback
./ops.sh restore
```

### 3.2 release 离线包链

只记：

```bash
./ops.sh release check
./ops.sh release install
./ops.sh release upgrade
./ops.sh release rollback
./ops.sh release status
./ops.sh release inspect
./ops.sh release verify
```

## 4. 脚本分类

### 4.1 部署类

- `ops.sh deploy`
- `ops.sh release install`

### 4.2 备份恢复类

- `ops.sh backup`
- `ops.sh restore`
- `ops.sh rollback`
- `ops.sh release rollback`

### 4.3 升级类

- `ops.sh upgrade`
- `ops.sh release upgrade`

### 4.4 巡检与状态类

- `ops.sh release check`
- `ops.sh release status`
- `ops.sh release inspect`
- `ops.sh release verify`

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
./ops.sh deploy
```

### 备份

```bash
./ops.sh backup
```

### 升级

```bash
./ops.sh upgrade
```

### 回滚

```bash
./ops.sh rollback --latest --dry-run
```

### release 安装

```bash
./ops.sh release install
```

## 8. 兼容说明

以下旧命令依然可继续使用：

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

但从交付、培训和日常运维角度，推荐以后统一使用 `./ops.sh`。

## 9. 建议配合阅读

- [从这里开始](./start-here.md)
- [客户交付快速开始](./customer-delivery-quick-start.md)
- [运维 SOP 手册](./operations-sop.md)
