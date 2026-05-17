# 客户交付快速开始

本文档面向最终客户、实施人员或售后同事，目标是用最短路径把系统正式跑起来并完成基础初始化。

## 1. 你会拿到什么

标准交付通常包含：

- 项目源码或发布包
- 部署文档
- 环境变量模板
- 品牌 Logo 与基础素材
- 默认管理员初始化说明

## 2. 最推荐的部署方式

按交付场景区分：

### 方式 A：源码一键部署

适合：

- 客户服务器可以拉取 Git 仓库
- 需要后续持续更新代码
- 现场具备基础运维能力

执行入口：

```bash
./deploy.sh --env-file .env --branch main --remote origin
```

### 方式 B：离线发布包部署

适合：

- 客户服务器不方便访问 Git
- 需要标准化交付与升级
- 希望安装链路更可控

执行入口：

```bash
./release-install.sh
```

## 3. 上线前必须确认的配置

至少确认这些值已经替换成正式值：

- `MYSQL_PASSWORD`
- `MYSQL_ROOT_PASSWORD`
- `ADMIN_PASSWORD`
- `ADMIN_AUTH_SECRET`
- `APP_DATA_ENCRYPTION_KEY`
- `CORS_ALLOWED_ORIGIN_PATTERNS`
- `WEB_PORT`
- `PUBLIC_BASE_URL`

如启用 AI，还需要：

- `VOLCENGINE_API_KEY`

## 4. 首次上线后的 5 个动作

系统启动成功后，建议立刻完成以下动作：

1. 登录后台
2. 立即修改管理员密码
3. 进入站点配置，补齐首页、门店、关于我们与媒体资源
4. 进入 AI 生图配置，补齐正式密钥和模型
5. 进入运维中心，执行一次巡检并确认状态正常

## 5. 客户最常用的后台入口

正式运营时最常用的页面是：

- `运营总览`
- `作品管理`
- `站点配置`
- `AI 生图配置`
- `用户留言`
- `运维中心`
- `操作日志`

## 6. 交付后建议立即做的留档

建议第一次初始化完成后，立刻做三件事：

1. 在运维中心导出一份配置包
2. 执行一次完整备份
3. 记录当前管理员账号、访问地址、部署时间和版本号

## 7. 常见问题

### 7.1 后台登录不上

先检查：

- `ADMIN_USERNAME`
- `ADMIN_PASSWORD`
- 浏览器是否残留旧 token

### 7.2 AI 生图不可用

先检查：

- 是否启用 AI
- `VOLCENGINE_API_KEY` 是否有效
- 模型名是否正确
- 运维中心里 AI 状态是否正常

### 7.3 上传图片失败

先检查：

- 上传目录是否可写
- 磁盘空间是否足够
- 是否触发了上传并发保护

## 8. 推荐阅读顺序

如果你是第一次接手这个系统，建议按这个顺序看：

1. [安装手册](./installation-guide.md)
2. [部署前后巡检清单](./deployment-checklist.md)
3. [生产环境变量说明](./reference/env-reference.md)
4. [商业交付说明](./commercial-delivery.md)
5. [离线镜像发布包部署说明](./release-package-deployment.md)
