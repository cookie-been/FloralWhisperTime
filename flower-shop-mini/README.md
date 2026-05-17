# 花语时光微信小程序

微信小程序前台，使用原生小程序结构、TypeScript、WXML 和 WXSS。

当前小程序已经接入后端站点配置中的部分前台文案字段，可与 Web 端共用一部分首页、分类页、联系页配置。

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

## 当前能力

- 首页：轮播、公告、站点统计、分类入口、热门花束、品牌故事入口
- 分类页：分类切换、关键词搜索、排序、分页加载、下拉刷新
- 详情页：图片画廊、花材/寓意/标签、相关推荐、分享、联系门店
- 关于页：AboutPage 首屏、品牌故事、发展历程、团队成员、门店信息
- 联系页：地图、拨号、复制微信、门店展示图、在线留言
- 通用状态：加载中、空状态、错误重试、接口失败回退本地 mock

## 联调说明

小程序通过 `services/api.ts` / `services/api.js` 请求 `config/api.ts` / `config/api.js` 中配置的 API 地址，默认是：

```text
http://localhost:3001
```

如果你在电脑上本地联调：

1. 启动 Java 后端
2. 将 `flower-shop-mini/config/api.ts` 和 `flower-shop-mini/config/api.js` 改为你的局域网 IP
3. 微信开发者工具里勾选或按需关闭“校验合法域名、web-view（业务域名）、TLS 版本以及 HTTPS 证书”

真机预览前请改成局域网 IP 或正式 HTTPS 域名，并在微信小程序后台配置 request 合法域名。

## 运行时说明

小程序目录里同时保留 `.ts` 和 `.js`：

- `.ts` 用于源码维护
- `.js` 用于微信开发者工具真实运行

修改页面、组件、`services/`、`utils/` 后，必须保持 `.ts` 与 `.js` 同步。

公共跳转建议复用：

- `flower-shop-mini/utils/navigation.ts`
- `flower-shop-mini/utils/navigation.js`

小程序使用自己的本地共享副本：

- `flower-shop-mini/shared/types.ts`
- `flower-shop-mini/shared/data.ts`
- `flower-shop-mini/shared/api.ts`
- `flower-shop-mini/shared/data.js`
- `flower-shop-mini/shared/api.js`

不要直接把根目录 `shared/` 作为小程序运行时依赖。

## 已接入的站点配置字段

当前小程序已复用后台站点配置中的以下字段：

- 首页：`heroEyebrow`、`heroTitle`、`heroDescription`、`heroImage`、`heroSlides`
- 首页按钮：`primaryCtaText`、`secondaryCtaText`
- 首页统计：`stats`
- 首页模块：`homeStorySectionTitle`、`homeStorySectionIntro`、`homeFeaturedSectionTitle`、`homeFeaturedSectionIntro`
- 分类页：`galleryPageTitle`、`galleryPageIntro`、`gallerySearchPlaceholder`、`galleryEmptyText`、`galleryLoadErrorText`
- 联系页：`contactPageTitle`、`contactIntro`、`contactPageSubmitText`、`contactSubmitSuccessText`、`consultButtonText`、`businessHoursText`、`contactImages`
- 关于页模块：`aboutStorySectionEyebrow`、`aboutTeamSectionEyebrow`、`aboutTeamSectionTitle`、`aboutTeamSectionIntro`
- 关于页主体：`/api/about-page` 返回的 `heroImage`、`heroEyebrow`、`heroTitle`、`heroSubtitle`、`storyTitle`、`storyContent`
- 关于页时间轴：`/api/about-timeline`

如果后台新增了前台字段，而小程序还没用上，需要同时更新：

- `flower-shop-mini/shared/types.ts`
- `flower-shop-mini/services/api.ts`
- `flower-shop-mini/services/api.js`
- 对应页面的 `.ts / .js / .wxml`

## 兜底策略

- 远程接口可用：优先读后端真实数据
- 远程接口异常：自动回退到 `flower-shop-mini/shared/` 中的本地 mock
- 页面异常：统一使用 `components/StateSection/` 展示加载、空态、错误和重试
