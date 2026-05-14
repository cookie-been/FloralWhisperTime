# 花语时光微信小程序

微信小程序前台，使用原生小程序结构、TypeScript、WXML 和 WXSS。

## 使用方式

1. 打开微信开发者工具
2. 导入 `flower-shop-mini`
3. 使用 `flower-shop-mini/project.config.json` 作为小程序工程配置

## 页面

- `pages/index/index`：首页
- `pages/category/index`：分类列表
- `pages/flower-detail/index`：作品详情
- `pages/about/index`：关于我们
- `pages/contact/index`：联系我们

## 数据

小程序通过 `services/api.ts` 请求 `config/api.ts` 中配置的 API 地址，默认是：

```text
http://localhost:3001
```

真机预览前请改成局域网 IP 或正式 HTTPS 域名，并在微信小程序后台配置 request 合法域名。

小程序使用自己的本地共享副本：

- `flower-shop-mini/shared/types.ts`
- `flower-shop-mini/shared/data.ts`
- `flower-shop-mini/shared/api.ts`

不要直接把根目录 `shared/` 作为小程序运行时依赖。
