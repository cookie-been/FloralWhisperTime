# 花语时光 PC Web

React 19 + Vite 7 + Tailwind CSS 3 + Ant Design 6 Web 端，包含前台站点与后台管理界面。

## 开发

```bash
npm install
npm run dev
```

请先启动 Java 后端：

```bash
cd ../flower-shop-backend-java
mvn spring-boot:run
```

默认开发地址：

- Web：`http://localhost:5173`
- API：`http://localhost:3001`

本地开发如需修改后端地址，可设置 `VITE_API_BASE_URL`。

## 构建

```bash
npm run build
```

构建流程固定为：

```bash
tsc -b && vite build
```

## 页面

- `/` 首页
- `/gallery` 作品画廊
- `/gallery/:id` 作品详情
- `/about` 关于我们
- `/contact` 联系我们
- `/admin/login` 管理员登录
- `/admin` 运营总览
- `/admin/flowers` 作品管理
- `/admin/settings` 内容配置
- `/admin/contacts` 用户留言

## 数据

Web 端通过 `src/services/api.ts` 请求后端。

- 开发态默认走 `http://localhost:3001`
- Docker 部署态默认走同源 `/api`

后台当前支持：

- 作品新增、编辑、删除、上传图片
- 首页与门店内容维护
- 关于我们页内容维护
- 用户留言查看与已读处理
