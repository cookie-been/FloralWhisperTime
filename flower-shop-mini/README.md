# 花语时光微信小程序

纯展示型鲜花店微信小程序，使用原生小程序结构、TypeScript、WXML 和 WXSS。

## 使用方式

1. 打开微信开发者工具。
2. 导入当前目录 `flower-shop-mini`。
3. AppID 可使用测试号或保留 `touristappid` 进行预览。

## 页面

- `pages/index/index` 首页：轮播、公告、分类入口、热门花束、品牌故事入口。
- `pages/category/index` 分类：分类 Tab、热门/最新/价格排序、花束网格。
- `pages/flower-detail/index` 详情：图片画廊、花材、寓意、相关推荐。
- `pages/about/index` 关于我们：品牌故事、店铺信息。
- `pages/contact/index` 联系我们：地图、导航、拨号、复制微信号。

## 数据

小程序端通过 `services/api.ts` 请求 `config/api.ts` 中配置的后端地址，默认是 `http://localhost:3001`。Web 前台、Web 管理页和小程序读取同一套后端数据。

真机预览时请把 `config/api.ts` 改成电脑局域网 IP 或正式 HTTPS 域名，并在微信小程序后台配置 request 合法域名。
