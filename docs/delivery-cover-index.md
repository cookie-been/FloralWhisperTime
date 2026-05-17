# 花语时光交付说明首页

欢迎使用《花语时光鲜花店展示系统》交付资料。

这份说明页适合作为客户收到交付包后第一眼看到的总入口，也适合放在文档包最前面。

## 1. 你收到的是什么

本次交付的是一套鲜花店品牌展示系统，包含：

- Web 前台
- Web 管理后台
- Java + MySQL 后端
- 部署脚本与发布包能力
- 文档、素材与交付模板

系统主要用于：

- 品牌展示
- 作品展示
- 门店信息展示
- 留言收集
- 后台内容维护
- AI 辅助生成作品图和内容建议

## 2. 你最先应该看什么

如果你现在的目标是“先把系统跑起来”，建议按这个顺序阅读：

1. [客户交付快速开始](./customer-delivery-quick-start.md)
2. [安装手册](./installation-guide.md)
3. [部署前后巡检清单](./deployment-checklist.md)
4. [生产环境变量说明](./reference/env-reference.md)

## 3. 不同角色推荐阅读入口

### 客户负责人

优先看：

- [客户交付快速开始](./customer-delivery-quick-start.md)
- [客户验收清单](./customer-acceptance-checklist.md)
- [商业交付说明](./commercial-delivery.md)

### 实施 / 运维人员

优先看：

- [安装手册](./installation-guide.md)
- [运维 SOP 手册](./operations-sop.md)
- [售后排障手册](./support-troubleshooting-manual.md)
- [交付包目录说明](./delivery-package-guide.md)

### 运营 / 内容维护人员

优先看：

- [后台操作手册](./admin-operations-manual.md)
- [素材交付规范](./assets-delivery-spec.md)
- [内容填写规范](./branding-content-guide.md)

### 开发 / 二开人员

优先看：

- [系统架构](./architecture.md)
- [接口文档](./api.md)
- [接口调用示例](./reference/api-examples.md)
- [数据字典](./reference/database-dictionary.md)

## 4. 当前交付能力概览

当前版本已经具备：

- Docker 一键部署
- 离线 release 包部署
- 后台动态配置
- AI 生图与作品信息建议
- 逻辑删除与恢复
- 操作日志审计与按快照恢复
- 基础限流与并发保护
- 运维中心、备份、巡检与配置迁移能力

## 5. 正式上线前必须确认的事

至少确认：

- 已替换正式管理员密码
- 已替换 `ADMIN_AUTH_SECRET`
- 已替换 `APP_DATA_ENCRYPTION_KEY`
- 已准备正式素材
- 已补齐正式站点内容
- 已完成一次巡检
- 已完成一次备份

## 6. 如果部署后出问题先看哪里

优先顺序：

1. [售后排障手册](./support-troubleshooting-manual.md)
2. [运维 SOP 手册](./operations-sop.md)
3. [部署前后巡检清单](./deployment-checklist.md)

## 7. 本次交付应附带哪些资料

建议至少附带：

- 文档包
- 发布包或源码包
- 环境变量模板
- 客户验收清单
- 版本发布说明
- 品牌素材包

## 8. 推荐继续阅读

完整文档目录见：

- [文档索引](./README.md)
