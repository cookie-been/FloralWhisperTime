# 文档索引

本目录保存面向交付、部署、维护和二次运营的正式文档。

当前系统已经具备以下交付级能力：

- Docker 一键部署与离线发布包部署
- 管理后台动态配置
- AI 生图与作品信息建议
- 逻辑删除与回收恢复
- 操作日志审计与按快照恢复
- 基础限流、并发隔离与运维中心状态展示

## 快速入口

如果你现在就要把系统交付或部署起来，优先看这几份：

1. [客户交付快速开始](./customer-delivery-quick-start.md)
2. [安装手册](./installation-guide.md)
3. [部署前后巡检清单](./deployment-checklist.md)
4. [生产环境变量说明](./env-reference.md)
5. [后台操作手册](./admin-operations-manual.md)
6. [售后排障手册](./support-troubleshooting-manual.md)
7. [运维 SOP 手册](./operations-sop.md)
8. [权限与安全说明](./security-and-permissions.md)
9. [接口调用示例](./api-examples.md)

## 产品与架构

- [功能说明](./features.md)
- [系统架构](./architecture.md)
- [接口文档](./api.md)
- [接口调用示例](./api-examples.md)
- [权限与安全说明](./security-and-permissions.md)
- [商业交付说明](./commercial-delivery.md)

## 交付与上线

- [客户交付快速开始](./customer-delivery-quick-start.md)
- [安装手册](./installation-guide.md)
- [后台操作手册](./admin-operations-manual.md)
- [新服务器首次上线操作手册](./first-server-go-live.md)
- [切换正式部署前检查清单](./pre-production-cutover-checklist.md)
- [部署前后巡检清单](./deployment-checklist.md)
- [离线镜像发布包部署说明](./release-package-deployment.md)

## 运维与恢复

- [售后排障手册](./support-troubleshooting-manual.md)
- [运维 SOP 手册](./operations-sop.md)
- [版本发布说明模板](./release-notes-template.md)
- [数据字典](./database-dictionary.md)
- [备份与恢复说明](./backup-restore.md)
- [升级说明](./upgrade-guide.md)
- [回滚说明](./rollback-guide.md)

## 环境与本地开发

- [生产环境变量说明](./env-reference.md)
- [正式环境 `.env` 模板](./production-env-template.md)
- [本地开发环境说明](./local-development-guide.md)
- [本地开发 `.env` 示例](./local-dev-env-example.md)

## 网络入口与 HTTPS

- [Nginx HTTPS 接入示例](./nginx-https-example.md)
- [Nginx HTTPS 正式环境示例](./nginx-https-production-example.md)

## 建议阅读顺序

### 面向客户 / 实施 / 售后

1. [客户交付快速开始](./customer-delivery-quick-start.md)
2. [安装手册](./installation-guide.md)
3. [后台操作手册](./admin-operations-manual.md)
4. [售后排障手册](./support-troubleshooting-manual.md)
5. [部署前后巡检清单](./deployment-checklist.md)
6. [生产环境变量说明](./env-reference.md)
7. [商业交付说明](./commercial-delivery.md)
8. [版本发布说明模板](./release-notes-template.md)
9. [权限与安全说明](./security-and-permissions.md)

### 面向开发接手

1. `README.md`
2. [功能说明](./features.md)
3. [系统架构](./architecture.md)
4. [接口文档](./api.md)
5. [接口调用示例](./api-examples.md)
6. [权限与安全说明](./security-and-permissions.md)
7. [数据字典](./database-dictionary.md)
8. [本地开发环境说明](./local-development-guide.md)
