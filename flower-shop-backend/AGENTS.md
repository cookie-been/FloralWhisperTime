# flower-shop-backend

Express 5 后端服务，JSON 文件数据库，图片上传。单文件（server.js）包含所有路由。

## API ENDPOINTS

| 方法 | 路径 | 鉴权 | 说明 |
|------|------|------|------|
| GET | /api/flowers | 无 | 花束列表（支持 categoryId/tag/keyword/sortBy/page/limit 查询参数） |
| GET | /api/flowers/:id | 无 | 花束详情 |
| GET | /api/flowers/:id/related | 无 | 相关推荐（同分类或同标签） |
| POST | /api/flowers | Admin | 新增花束 |
| PUT | /api/flowers/:id | Admin | 编辑花束 |
| DELETE | /api/flowers/:id | Admin | 删除花束 |
| POST | /api/uploads | Admin | 图片上传（multipart/form-data） |
| GET | /api/categories | 无 | 分类列表 |
| GET/PUT | /api/site-config | PUT需Admin | 站点配置 |
| GET | /api/shop-info | 无 | 门店信息 |
| GET | /api/brand-story | 无 | 品牌故事 |
| GET | /api/team | 无 | 团队成员 |
| POST | /api/contact | 无 | 提交留言 |
| POST | /api/admin/login | 无 | 管理登录 → 返回 token |
| GET | /api/admin/me | Admin | 验证当前 token |

## CONVENTIONS

- **ESM only**: `"type": "module"`，所有 import/export，勿用 require()
- **错误格式**: `res.status(N).json({ message: "..." })`，统一格式
- **鉴权**: Base64URL 编码 HMAC-SHA256 token，`Authorization: Bearer <token>` 头传递
- **图片上传**: multer，仅接受 image/*，5MB 限制，文件名 `Date.now()-随机数.ext`

## ANTI-PATTERNS

- **勿直接编辑 `data/db.json`** — 通过 API 写入，手动编辑会破坏 JSON 格式一致性
- **勿添加额外依赖** — 当前仅 express + cors + multer，够用

## COMMANDS

```bash
npm install
npm run dev    # node --watch server.js，默认 :3001
```

环境变量: `PORT`, `PUBLIC_BASE_URL`, `ADMIN_USERNAME`, `ADMIN_PASSWORD`, `ADMIN_AUTH_SECRET`
