# 权限与安全说明

本文档用于说明当前系统的认证、权限、密钥、限流与并发保护策略，便于交付、售后和二次开发时统一口径。

## 1. 安全目标

当前版本的安全设计目标是：

- 保护后台写接口
- 避免默认密码直接长期运行
- 避免敏感密钥明文暴露
- 降低短时间突发请求把服务拖垮的风险
- 为后续更高等级安全与高可用扩展保留边界

## 2. 认证方式

后台当前采用：

- Spring Security
- JWT Bearer Token

登录入口：

```text
POST /api/admin/login
```

受保护接口需要：

```text
Authorization: Bearer <token>
```

## 3. 管理员账号与密码

### 3.1 初始来源

管理员账号密码初始来自环境变量：

- `ADMIN_USERNAME`
- `ADMIN_PASSWORD`

### 3.2 首次登录强制改密

当前系统已启用首次登录强制改密机制。

也就是说：

- 管理员第一次登录可以使用环境变量中的初始密码
- 登录成功后，系统会要求先修改密码
- 不改密时，后台会限制继续操作

### 3.3 改密后的实际生效位置

改密后，密码状态以数据库中的 `admin_security_state` 为准，而不是单纯依赖 `.env`。

### 3.4 密码存储方式

管理员密码修改后使用：

- BCrypt 存储

## 4. JWT 密钥

JWT 相关密钥由：

- `ADMIN_AUTH_SECRET`

控制。

要求：

- 生产环境必须替换默认值
- 建议至少 32 位随机字符串
- 不要与其他密钥共用

## 5. 数据加密密钥

当前系统还使用：

- `APP_DATA_ENCRYPTION_KEY`

作为数据加密相关密钥。

要求：

- 生产环境必须替换默认值
- 不要和 `ADMIN_AUTH_SECRET` 使用相同值
- 已上线环境不要随意变更

## 6. AI 密钥安全

AI 相关配置由后台维护，核心要求：

- API Key 不应在前端明文回显
- 后台只展示是否已配置和脱敏信息
- 正式环境与测试环境建议使用不同密钥

## 7. 写接口权限范围

当前以下写接口要求管理员身份：

- `POST /api/flowers`
- `PUT /api/flowers/**`
- `DELETE /api/flowers/**`
- `POST /api/uploads`
- `PUT /api/site-config`
- `/api/admin/**`
- `/api/admin/ai/**`

公开读取接口默认允许访问。

## 8. 操作日志与审计

当前系统已启用后台操作日志，用于：

- 记录后台写操作
- 记录登录等关键安全动作
- 记录恢复链路

当前默认不记录：

- 普通查询请求

## 9. 逻辑删除与恢复

当前以下模块采用逻辑删除：

- 作品
- 留言
- About 时间轴
- 团队成员

这属于“防误操作”的一部分安全策略。

## 10. 基础限流

当前系统已启用四组基础限流：

- 公开读取
- 公开写入
- 管理后台
- 高成本接口

对应环境变量包括：

- `PROTECTION_PUBLIC_READ_CAPACITY`
- `PROTECTION_PUBLIC_WRITE_CAPACITY`
- `PROTECTION_ADMIN_CAPACITY`
- `PROTECTION_HEAVY_CAPACITY`

## 11. 并发隔离

当前高成本接口已做并发隔离：

- AI 生图 / AI 文案建议
- 图片上传
- 配置导入

对应环境变量包括：

- `PROTECTION_CONCURRENCY_AI_MAX_CONCURRENT`
- `PROTECTION_CONCURRENCY_UPLOAD_MAX_CONCURRENT`
- `PROTECTION_CONCURRENCY_CONFIG_IMPORT_MAX_CONCURRENT`

## 12. 只读缓存

当前公开只读数据使用 Caffeine 本地缓存。

适用范围主要包括：

- 站点配置
- 门店信息
- 品牌故事
- About 内容
- 分类列表

## 13. 运维中心安全视角

运维中心当前可直接看到：

- 是否仍需修改管理员初始密码
- AI 是否启用、密钥是否已配置
- 限流阈值
- 并发阈值
- 已触发限流次数
- 已触发繁忙拒绝次数
- 安全风险摘要

## 14. 生产环境最低要求

正式部署时，至少应满足：

1. 替换默认管理员密码
2. 替换 `ADMIN_AUTH_SECRET`
3. 替换 `APP_DATA_ENCRYPTION_KEY`
4. 如启用 AI，使用正式 API Key
5. 复核限流与并发阈值
6. 首次部署后执行一次巡检和备份

## 15. 当前边界

当前安全策略定位是：

- 防误操作
- 防普通越权
- 防低强度滥用

当前还不属于：

- 多租户高强度隔离方案
- 完整企业 IAM 体系
- 零信任安全体系

## 16. 建议配合阅读

- [生产环境变量说明](./reference/env-reference.md)
- [部署前后巡检清单](./deployment-checklist.md)
- [售后排障手册](./support-troubleshooting-manual.md)
- [数据字典](./reference/database-dictionary.md)
