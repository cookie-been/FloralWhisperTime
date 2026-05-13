# 花语时光鲜花店展示系统交接文档

## 1. 项目现状

本项目是「花语时光」鲜花店展示系统，已经从静态 Mock 展示升级为带后端数据源的双端系统：

- PC Web 前台：展示首页、作品画廊、作品详情、关于我们、联系我们。
- PC Web 后台：管理员登录后管理作品和站点配置。
- 微信小程序端：展示首页、分类、详情、关于我们、联系我们，并读取同一后端数据。
- 后端服务：Express API + 本地 JSON 数据库 + 本地图片上传目录。

当前不包含购物车、支付、订单、库存、客户登录、会员中心等电商能力。

## 2. 目录结构

```text
D:\workspace\project\FloralWhisperTime
├── flower-shop-backend/     # Express 后端、JSON 数据库、上传目录
├── flower-shop-web/         # React + Vite PC Web 前台与后台
├── flower-shop-mini/        # 微信小程序原生工程
├── shared/                  # 双端共享类型与早期 Mock 数据
├── README.md                # 简要运行说明
├── PROJECT_HANDOFF.md       # 当前交接文档
└── 鲜花店展示方案.zip        # 原始需求方案
```

重要文件：

- 后端入口：`flower-shop-backend/server.js`
- 后端数据：`flower-shop-backend/data/db.json`
- 上传图片：`flower-shop-backend/uploads/`
- Web API 封装：`flower-shop-web/src/services/api.ts`
- Web 路由：`flower-shop-web/src/router/index.tsx`
- 小程序 API 地址：`flower-shop-mini/config/api.ts`
- 共享类型：`shared/types.ts`

## 3. 启动方式

先启动后端：

```bash
cd D:\workspace\project\FloralWhisperTime\flower-shop-backend
npm install
npm run dev
```

默认后端地址：

```text
http://localhost:3001
```

再启动 Web：

```bash
cd D:\workspace\project\FloralWhisperTime\flower-shop-web
npm install
npm run dev
```

默认 Web 地址：

```text
http://localhost:5173
```

Web 构建验证：

```bash
cd D:\workspace\project\FloralWhisperTime\flower-shop-web
npm run build
```

小程序预览：

1. 打开微信开发者工具。
2. 导入 `D:\workspace\project\FloralWhisperTime\flower-shop-mini`。
3. 本机模拟器可用 `http://localhost:3001`。
4. 真机预览需要把 `flower-shop-mini/config/api.ts` 改为电脑局域网 IP 或正式 HTTPS 域名，并配置微信小程序 request 合法域名。

## 4. 管理后台

后台登录页：

```text
http://localhost:5173/admin/login
```

默认账号：

```text
账号：admin
密码：Floral@2026
```

生产环境必须通过环境变量修改：

```text
ADMIN_USERNAME
ADMIN_PASSWORD
ADMIN_AUTH_SECRET
```

后台页面：

- `/admin/login`：管理员登录。
- `/admin/flowers`：作品管理，支持新增、编辑、删除、上传图片。
- `/admin/settings`：站点配置，支持管理首页文案、品牌故事、地址、电话、微信、经纬度、营业时间、页脚简介、统计数据等。

鉴权方式：

- 登录接口返回 token。
- Web 端把 token 存到 `localStorage`。
- 管理类接口通过 `Authorization: Bearer <token>` 调用。
- 后端对作品新增、编辑、删除、图片上传、站点配置保存做了 `requireAdmin` 保护。

## 5. 数据模型与存储

主要数据都保存在：

```text
flower-shop-backend/data/db.json
```

核心字段：

- `categories`：花束分类。
- `flowers`：花束作品。
- `shopInfo`：门店信息。
- `brandStory`：品牌故事。
- `siteConfig`：首页与站点可配置文案。
- `teamMembers`：团队成员。
- `contacts`：联系表单留言。

作品 `Flower` 关键字段：

```ts
{
  id: string;
  name: string;
  categoryId: string;
  images: string[];
  price: number;
  description: string;
  materials: string[];
  meaning: string;
  tags: string[];
  featured: boolean;
  sort: number;
  createdAt: string;
}
```

站点配置 `SiteConfig` 关键字段：

```ts
{
  brandName: string;
  heroEyebrow: string;
  heroTitle: string;
  heroDescription: string;
  heroImage: string;
  primaryCtaText: string;
  secondaryCtaText: string;
  stats: { value: string; label: string }[];
  contactIntro: string;
  businessHoursText: string;
  footerDescription: string;
}
```

注意：

- 现在使用 JSON 文件作为轻量数据库。
- 不适合高并发生产环境。
- 后续生产化建议迁移到 SQLite、PostgreSQL、MySQL 或云数据库。

## 6. 后端 API

公开接口：

- `GET /api/health`
- `GET /api/site-config`
- `GET /api/flowers`
- `GET /api/flowers/:id`
- `GET /api/flowers/:id/related`
- `GET /api/categories`
- `GET /api/shop-info`
- `GET /api/brand-story`
- `GET /api/team`
- `POST /api/contact`

管理员接口：

- `POST /api/admin/login`
- `GET /api/admin/me`
- `PUT /api/site-config`
- `POST /api/flowers`
- `PUT /api/flowers/:id`
- `DELETE /api/flowers/:id`
- `POST /api/uploads`

`GET /api/flowers` 支持参数：

- `categoryId`
- `tag`
- `keyword`
- `sortBy`: `featured` / `latest` / `price_asc` / `price_desc`
- `page`
- `limit`

## 7. Web 端功能

技术栈：

- React
- TypeScript
- Vite
- Tailwind CSS
- Ant Design
- React Router

主要页面：

- `Home`：首页，读取 `siteConfig`、精选作品、品牌故事、门店地址。
- `Gallery`：作品画廊，支持分类、搜索、排序。
- `FlowerDetail`：作品详情，支持相关推荐。
- `About`：品牌故事、团队和门店信息。
- `Contact`：门店信息、地图、联系表单。
- `AdminLogin`：管理员登录。
- `AdminFlowers`：作品管理。
- `AdminSettings`：站点配置。

Web 端所有 API 统一在：

```text
flower-shop-web/src/services/api.ts
```

如需改后端地址，可设置：

```text
VITE_API_BASE_URL
```

## 8. 小程序端功能

技术栈：

- 微信小程序原生框架
- TypeScript
- WXML
- WXSS

页面：

- `pages/index/index`：首页，读取站点配置、分类、热门作品。
- `pages/category/index`：分类列表，支持分类和排序。
- `pages/flower-detail/index`：作品详情和相关推荐。
- `pages/about/index`：品牌故事与店铺信息。
- `pages/contact/index`：地图、拨号、复制微信号、营业时间文案。

小程序后端地址配置：

```text
flower-shop-mini/config/api.ts
```

默认：

```ts
export const API_BASE_URL = "http://localhost:3001";
```

## 9. 当前已验证

已完成验证：

- 后端 `/api/health` 正常。
- 后端 `/api/site-config` 正常返回配置。
- 管理员登录正常返回 token。
- 未登录访问写接口会返回 `401`。
- 登录后 `PUT /api/site-config` 可保存配置。
- Web `/`、`/contact`、`/admin/settings` 返回 200。
- `npm run build` 构建通过。

构建提示：

- Ant Design chunk 较大，Vite 会提示 chunk 超过 500 KB。
- 这是依赖体积警告，不影响当前运行。
- 后续可通过按需引入、拆包或替换部分后台组件优化。

## 10. 已知注意事项

1. PowerShell 直接打印中文时可能出现乱码显示，但 Node 按 UTF-8 读取 `db.json` 是正常的。
2. 不建议用 PowerShell 手写包含中文的大段 JSON 回写 `db.json`，容易受编码影响。
3. 管理后台当前是简单 token 鉴权，适合开发和演示，不是完整生产级安全方案。
4. 上传图片保存在本地 `uploads/`，部署到云服务器时需要持久化该目录。
5. 小程序真机预览不能直接访问电脑的 `localhost`，需要局域网 IP 或 HTTPS 域名。

## 11. 后续建议

优先级较高：

- 给后台增加分类管理。
- 给后台增加品牌故事图片上传，而不只是填写 URL。
- 给后台增加留言查看和处理状态。
- 增加更正式的登录过期时间和退出后 token 失效机制。
- 把 JSON 数据库迁移到 SQLite 或 PostgreSQL。
- 增加后端数据备份机制。

体验优化：

- 后台增加图片预览、拖拽排序、批量删除。
- 前台图片加载失败时显示占位图。
- 小程序端补充搜索框和更多筛选能力。
- 后台站点配置增加实时预览。
- Web 前台做移动端细节检查。

生产化：

- 使用 HTTPS 域名部署后端。
- 配置小程序 request 合法域名。
- 图片上传迁移到 OSS/COS/S3 等对象存储。
- 增加环境变量 `.env.example`。
- 增加后端日志、错误监控和接口限流。

## 12. 后续接手提示

如果后续上下文丢失，接手者应该先做这几步：

1. 阅读本文件。
2. 启动 `flower-shop-backend`。
3. 启动 `flower-shop-web`。
4. 打开 `/admin/login`，用默认账号登录。
5. 检查 `/admin/settings` 和 `/admin/flowers` 是否正常。
6. 开始新增功能前，优先检查 `server.js`、`api.ts`、`db.json`、对应页面组件。

当前系统的核心设计原则：

- 前台只展示，不做交易。
- 后台所有写操作必须登录。
- Web 和小程序必须读取同一个后端数据源。
- 可配置内容尽量进入 `siteConfig` 或后台管理，而不是硬编码在页面里。
