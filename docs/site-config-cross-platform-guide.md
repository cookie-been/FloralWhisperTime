# 站点配置跨端复用说明

本文档说明当前后台 `SiteConfig` 中，哪些字段已经被 Web 前台和微信小程序共同消费。

## 目的

统一后台配置后，运营人员在后台修改一次文案或媒体资源，应尽量让 Web 前台与微信小程序前台同时生效，减少双端分散维护。

## 当前已跨端复用的字段

### 首页首屏

- `heroEyebrow`
- `heroTitle`
- `heroDescription`
- `heroImage`
- `heroSlides`
- `primaryCtaText`
- `secondaryCtaText`

说明：

- Web 首页优先使用 `heroSlides`，没有时回退 `heroImage`
- 小程序首页现在也优先使用 `heroSlides`，没有时回退 `heroImage`

### 首页内容模块

- `stats`
- `homeStorySectionTitle`
- `homeStorySectionIntro`
- `homeFeaturedSectionTitle`
- `homeFeaturedSectionIntro`

### 分类页 / 作品页入口文案

- `galleryPageTitle`
- `galleryPageIntro`
- `gallerySearchPlaceholder`
- `galleryEmptyText`
- `galleryLoadErrorText`

说明：

- Web 当前主要使用这些字段在作品画廊页面
- 小程序当前用于 `pages/category/index`

### 联系页

- `contactPageTitle`
- `contactIntro`
- `contactPageSubmitText`
- `contactSubmitSuccessText`
- `consultButtonText`
- `businessHoursText`
- `contactImages`

### 关于页模块文案

- `aboutStorySectionEyebrow`
- `aboutTeamSectionEyebrow`
- `aboutTeamSectionTitle`
- `aboutTeamSectionIntro`

说明：

- Web 关于页还消费更多 `AboutPageContent` 独立内容
- 小程序关于页现在也会消费 `AboutPageContent` 的首屏标题、副标题、主图和故事正文

### 关于页主体内容

- `AboutPageContent.heroImage`
- `AboutPageContent.heroEyebrow`
- `AboutPageContent.heroTitle`
- `AboutPageContent.heroSubtitle`
- `AboutPageContent.storyTitle`
- `AboutPageContent.storyContent`
- `AboutTimelineEntry`

## 仍未完全统一的部分

以下内容目前还没有做到完全同源：

### 关于页展示形式

- Web 关于页时间轴使用 `Timeline` 组件，支持更长内容和交错布局
- 小程序关于页当前使用纵向卡片式时间线，内容同源但展示更轻量

## 小程序接入新字段时必须同步的文件

如果后台新增 `SiteConfig` 字段，并希望小程序同步使用，至少需要一起更新：

1. `flower-shop-mini/shared/types.ts`
2. `flower-shop-mini/services/api.ts`
3. `flower-shop-mini/services/api.js`
4. 对应页面的 `.ts`
5. 对应页面的 `.js`
6. 对应页面的 `.wxml`

## 建议的后续统一顺序

推荐按下面顺序继续推进：

1. 继续把后台“站点配置”页面中的前台字段按“Web + 小程序共用 / Web 独有”进行分组标识
2. 继续把更多 About 页独立配置做成明确的跨端标注
3. 评估小程序时间轴是否需要折叠、分页或更紧凑的视觉样式
