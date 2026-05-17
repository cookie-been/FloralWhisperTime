# 从这里开始

如果你觉得现在文档和脚本太多，看不过来，就先只看这一页。

## 1. 先记住这 6 个根目录命令

日常只需要记住根目录这些入口：

```bash
./deploy.sh
./backup.sh
./upgrade.sh
./rollback.sh
./release-install.sh
./release-upgrade.sh
```

说明：

- 这些是对外公开入口
- `ops/` 目录下是实现层脚本，日常不用先记

## 2. 你现在属于哪种场景

### 场景 A：我要把系统部署起来

先看：

1. [客户交付快速开始](./customer-delivery-quick-start.md)
2. [安装手册](./installation-guide.md)
3. [部署前后巡检清单](./deployment-checklist.md)

### 场景 B：我要日常维护系统

先看：

1. [后台操作手册](./admin-operations-manual.md)
2. [运维 SOP 手册](./operations-sop.md)
3. [售后排障手册](./support-troubleshooting-manual.md)

### 场景 C：我要交付给客户

先看：

1. [交付说明首页](./delivery-cover-index.md)
2. [客户验收清单](./customer-acceptance-checklist.md)
3. [最终交付清单模板](./templates/final-delivery-checklist-template.md)

### 场景 D：我要改代码或做二开

先看：

1. [系统架构](./architecture.md)
2. [接口文档](./api.md)
3. [接口调用示例](./reference/api-examples.md)
4. [数据字典](./reference/database-dictionary.md)

## 3. 你只需要记住这 3 个文档入口

如果只保留三个入口，优先记：

1. [文档索引](./README.md)
2. [从这里开始](./start-here.md)
3. [交付说明首页](./delivery-cover-index.md)

## 4. 为什么会看到很多脚本

因为系统同时支持两类部署：

- 源码部署
- release 离线包部署

所以脚本看起来会多一些，但实际对外只要记根目录入口即可。

## 5. 为什么会看到很多文档

因为文档现在覆盖了四类人：

- 客户
- 实施 / 运维
- 售后
- 开发 / 二开

你不需要一次全看完，只要按你的场景进入对应入口。

## 6. 最短路径建议

如果你现在最关心的是“别太乱，给我最短路径”：

- 部署：看 [客户交付快速开始](./customer-delivery-quick-start.md)
- 运营：看 [后台操作手册](./admin-operations-manual.md)
- 排障：看 [售后排障手册](./support-troubleshooting-manual.md)
- 交付：看 [最终交付清单模板](./templates/final-delivery-checklist-template.md)
