# 文档索引

本目录保存面向交付、部署、维护和二次运营的正式文档。

当前系统已经具备以下交付级能力：

- Docker 一键部署与离线发布包部署
- 管理后台动态配置
- AI 生图与作品信息建议
- 逻辑删除与回收恢复
- 操作日志审计与按快照恢复
- 基础限流、并发隔离与运维中心状态展示

## 产品与架构

- [功能说明](./features.md)
- [系统架构](./architecture.md)
- [接口文档](./api.md)
- [商业交付说明](./commercial-delivery.md)

## 部署与运维

- [安装手册](./installation-guide.md)
- [新服务器首次上线操作手册](./first-server-go-live.md)
- [切换正式部署前检查清单](./pre-production-cutover-checklist.md)
- [部署前后巡检清单](./deployment-checklist.md)
- [离线镜像发布包部署说明](./release-package-deployment.md)
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

首次接手项目时，建议按以下顺序阅读：

1. `README.md`
2. `docs/features.md`
3. `docs/architecture.md`
4. `docs/api.md`
5. `docs/installation-guide.md`
6. `docs/env-reference.md`
7. `docs/deployment-checklist.md`
8. `docs/commercial-delivery.md`

上线、交付或售后时，再按需查阅发布包、备份、升级、回滚和 HTTPS 文档。
