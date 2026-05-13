# 花语时光鲜花店展示系统

Monorepo 风格目录结构（非 npm workspaces，各子目录独立 `package.json` + `node_modules`）。
Express 5 后端 + React 19 + Vite 7 + Tailwind 3 + Ant Design 6 PC Web + 微信小程序原生（TypeScript + WXML + WXSS）。

## QUICK START

```bash
# 1. 启动后端（默认 :3001）
cd flower-shop-backend && npm install && npm run dev

# 2. 启动 Web（默认 :5173，需后端运行中）
cd flower-shop-web && npm install && npm run dev

# 3. 小程序：微信开发者工具导入 flower-shop-mini
```

| 命令 | 含义 |
|------|------|
| `npm run dev` (backend) | `node --watch server.js`（Node 内置 watch，非 nodemon） |
| `npm run dev` (web) | `vite --host 0.0.0.0` |
| `npm run build` (web) | `tsc -b && vite build`（先类型检查再构建） |

## KEY FACTS

- **后端**: Express 5（ESM, `"type": "module"`），单文件 `server.js` 包含所有路由，JSON 文件数据库 `data/db.json`，multer 图片上传至 `uploads/`
- **Web**: React 19 + Vite 7 + Tailwind 3 + Ant Design 6。路径别名 `@/` → `src/`，`@shared/` → `../shared/`
- **小程序**: 原生框架，5 个页面（首页/分类/详情/关于/联系），无购物车/支付/订单
- **认证**: Base64URL 编码 HMAC-SHA256 token，`Authorization: Bearer <token>`。默认账号 `admin` / `Floral@2026`
- **共享代码**: `shared/types.ts`、`shared/data.ts`、`shared/api.ts`。小程序另有本地副本 `flower-shop-mini/shared/`
- **无 lint / 无 test**: 三个子项目均无 lint 脚本或测试框架（`npm run lint` / `npm test` 不可用）
- **Web 构建**: 必须 `tsc -b && vite build`（跳过 tsc 会漏类型错误）。React/Ant Design/lucide-react 已配置独立 chunk

## WEB ROUTES

| 路径 | 页面 | 鉴权 |
|------|------|------|
| `/` | 首页 | 无 |
| `/gallery` | 作品画廊 | 无 |
| `/gallery/:id` | 作品详情 | 无 |
| `/about` | 关于我们 | 无 |
| `/contact` | 联系我们 | 无 |
| `/admin/login` | 管理员登录 | 无 |
| `/admin/flowers` | 作品管理 CRUD | Bearer token |
| `/admin/settings` | 站点配置 | Bearer token |

## ENV VARS

| 变量 | 所属 | 默认值 |
|------|------|--------|
| `PORT` | 后端 | `3001` |
| `PUBLIC_BASE_URL` | 后端 | `http://localhost:PORT` |
| `ADMIN_USERNAME` | 后端 | `admin` |
| `ADMIN_PASSWORD` | 后端 | `Floral@2026` |
| `ADMIN_AUTH_SECRET` | 后端 | `floral-whisper-time-dev-secret` |
| `VITE_API_BASE_URL` | Web | `http://localhost:3001` |
| `API_BASE_URL` (config/api.ts) | 小程序 | `http://localhost:3001` |

## ANTI-PATTERNS

- 勿直接编辑 `data/db.json` — 通过 API 写入，保持 JSON 一致性
- 勿删除 `shared/` 下文件 — 被双端引用
- 勿在后端用 `require()` — ESM only
- Web 构建勿跳过 `tsc -b` — 类型检查在 build 流程中
- 小程序端勿引根 `shared/` — 使用 `flower-shop-mini/shared/` 本地副本

## SUBDIR AGENTS

每个子目录另有独立的 `AGENTS.md` 提供更细粒度的 API 表、页面结构、组件清单。
