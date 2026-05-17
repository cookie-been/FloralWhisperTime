# 文档包目录结构建议

本文档用于说明正式交付时，建议如何组织单独的“文档包”，让客户、实施、售后、开发都能快速找到自己需要的内容。

## 1. 目标

一个好的文档包应该满足：

- 客户打开后知道先看什么
- 实施人员知道怎么部署
- 售后知道怎么排障
- 开发知道怎么接手

## 2. 推荐文档包结构

建议整理为：

```text
FloralWhisperTime-docs/
  00-交付说明首页.md
  01-客户快速开始/
  02-安装部署/
  03-后台操作/
  04-售后排障/
  05-安全与接口/
  06-发布与验收/
  07-开发接手/
```

## 3. 各目录建议内容

### `00-交付说明首页.md`

建议放：

- [交付说明首页](./delivery-cover-index.md)

作用：

- 客户第一眼先看它

### `01-客户快速开始/`

建议放：

- [客户交付快速开始](./customer-delivery-quick-start.md)
- [客户验收清单](./customer-acceptance-checklist.md)
- [商业交付说明](./commercial-delivery.md)

### `02-安装部署/`

建议放：

- [安装手册](./installation-guide.md)
- [部署前后巡检清单](./deployment-checklist.md)
- [交付包目录说明](./delivery-package-guide.md)
- [最终交付清单模板](./templates/final-delivery-checklist-template.md)
- [离线镜像发布包部署说明](./release-package-deployment.md)

### `03-后台操作/`

建议放：

- [后台操作手册](./admin-operations-manual.md)
- [素材交付规范](./assets-delivery-spec.md)
- [内容填写规范](./branding-content-guide.md)

### `04-售后排障/`

建议放：

- [售后排障手册](./support-troubleshooting-manual.md)
- [运维 SOP 手册](./operations-sop.md)
- [备份与恢复说明](./backup-restore.md)
- [升级说明](./upgrade-guide.md)
- [回滚说明](./rollback-guide.md)

### `05-安全与接口/`

建议放：

- [权限与安全说明](./security-and-permissions.md)
- [接口文档](./api.md)
- [接口调用示例](./reference/api-examples.md)
- [生产环境变量说明](./reference/env-reference.md)

### `06-发布与验收/`

建议放：

- [版本发布说明模板](./templates/release-notes-template.md)
- [首个正式版本发布样例](./releases/2026-05-17-v1.0.0-release-notes.md)
- [客户验收清单](./customer-acceptance-checklist.md)

### `07-开发接手/`

建议放：

- [系统架构](./architecture.md)
- [功能说明](./features.md)
- [数据字典](./reference/database-dictionary.md)
- [本地开发环境说明](./local-development-guide.md)

## 4. 命名建议

建议文档包名称：

```text
FloralWhisperTime-docs-v1.0.0.zip
```

如果是给某个具体客户：

```text
FloralWhisperTime-docs-客户名-v1.0.0.zip
```

## 5. 打包建议

建议打包前：

1. 删除无关临时文件
2. 确认版本号和发布日期一致
3. 把最重要的入口文档放最前面
4. 如有 PDF 版本，可同时提供 Markdown 和 PDF

## 6. 实际交付建议

如果客户不习惯看很多文件，建议至少单独导出这几份给客户负责人：

- 交付说明首页
- 客户交付快速开始
- 客户验收清单
- 商业交付说明

其余更偏技术的文档可以给实施和售后同事。

## 7. 建议配合阅读

- [交付说明首页](./delivery-cover-index.md)
- [交付包目录说明](./delivery-package-guide.md)
- [最终交付清单模板](./templates/final-delivery-checklist-template.md)
