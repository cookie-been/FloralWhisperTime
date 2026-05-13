# 花语时光 PC Web

纯展示型鲜花店 PC Web 应用，使用 React、TypeScript、Vite、Tailwind CSS 和 Ant Design 构建。

## 运行

```bash
npm install
npm run dev
```

请先启动后端：

```bash
cd ../flower-shop-backend
npm install
npm run dev
```

## 构建

```bash
npm run build
```

## 页面

- `/` 首页
- `/gallery` 作品画廊
- `/gallery/:id` 作品详情
- `/about` 关于我们
- `/contact` 联系我们
- `/admin/login` 管理者登录
- `/admin/flowers` 作品管理
- `/admin/settings` 站点配置

## 数据

Web 端通过 `src/services/api.ts` 请求 `http://localhost:3001` 后端。作品管理页会把新增、编辑、删除和上传图片结果写入后端 JSON 数据库；站点配置页会保存首页简介、门店地址、电话、微信、营业时间、品牌故事和页脚文案。
