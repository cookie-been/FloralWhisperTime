# 花语时光旧版 Node 后端

这是历史兼容版 Express 后端，不再作为默认部署主线。

当前默认主线后端是：

```text
../flower-shop-backend-java
```

保留这个目录的原因：

- 给 Java 后端提供旧版 JSON 数据参考
- 兼容历史数据导入
- 便于对照原始接口行为

## 运行

```bash
npm install
npm run dev
```

默认地址：`http://localhost:3001`

## 数据与上传

- 数据文件：`data/db.json`
- 上传目录：`uploads/`

## 注意

- 不建议把这个目录继续作为生产部署主线
- 新功能优先落在 `flower-shop-backend-java/`
- 如需从旧 JSON 数据迁移到 MySQL，请使用 Java 后端提供的 JSON 导入能力
