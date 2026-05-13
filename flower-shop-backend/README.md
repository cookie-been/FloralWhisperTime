# 花语时光后端

Express 后端服务，为 PC Web 和微信小程序提供同一套数据 API。

## 运行

```bash
npm install
npm run dev
```

默认地址：`http://localhost:3001`

默认管理账号：

- 账号：`admin`
- 密码：`Floral@2026`

生产环境请通过环境变量 `ADMIN_USERNAME`、`ADMIN_PASSWORD`、`ADMIN_AUTH_SECRET` 修改默认配置。

## 数据与上传

- 数据库文件：`data/db.json`
- 图片上传目录：`uploads/`
- 上传后的图片 URL：`http://localhost:3001/uploads/<filename>`

## API

- `GET /api/flowers`
- `GET /api/flowers/:id`
- `GET /api/flowers/:id/related`
- `POST /api/flowers`
- `PUT /api/flowers/:id`
- `DELETE /api/flowers/:id`
- `POST /api/uploads`
- `GET /api/site-config`
- `PUT /api/site-config`
- `GET /api/categories`
- `GET /api/shop-info`
- `GET /api/brand-story`
- `GET /api/team`
- `POST /api/contact`
