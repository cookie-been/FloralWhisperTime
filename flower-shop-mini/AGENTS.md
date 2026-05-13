# flower-shop-mini

微信小程序原生框架，TypeScript + WXML + WXSS。非 uni-app / Taro。

## STRUCTURE

```
flower-shop-mini/
├── components/          # 通用组件（各含 index.ts/js/wxml/wxss/json）
│   ├── CategoryTabs/    # 分类 Tab 切换
│   ├── FlowerCard/      # 花束卡片
│   ├── ImageGallery/    # 图片画廊（swiper）
│   ├── ShopMap/         # 门店地图（wx.openLocation）
│   └── SwiperBanner/    # 首页轮播
├── config/api.ts        # API_BASE_URL 配置
├── mock/data.ts         # 本地 Mock 数据
├── pages/               # 页面
│   ├── index/           # 首页：轮播 + 分类入口 + 热门花束
│   ├── category/        # 分类：Tab + 排序 + 花束网格
│   ├── flower-detail/   # 详情：画廊 + 花材 + 寓意 + 相关推荐
│   ├── about/           # 关于：品牌故事 + 门店信息
│   └── contact/         # 联系：地图 + 导航 + 拨号 + 复制微信号
├── services/api.ts      # wx.request 封装
├── shared/              # 本地副本（types/data/api，与 root shared/ 同步）
└── types/index.ts       # 本地类型定义
```

## PAGES

| 路径 | Tab | 描述 |
|------|-----|------|
| pages/index/index | 首页 | 轮播公告 + 分类入口 + 热门花束 + 品牌故事入口 |
| pages/category/index | 分类 | 分类 Tab + 排序 + 花束网格 |
| pages/about/index | 关于我们 | 品牌故事 + 店铺信息 + 团队成员 |
| pages/contact/index | 联系我们 | 地图 + 联系方式 + 拨号/复制微信号 |

## COMPONENTS

| 组件 | 用途 |
|------|------|
| SwiperBanner | 首页轮播图 |
| CategoryTabs | 分类标签切换 |
| FlowerCard | 花束卡片展示 |
| ImageGallery | 详情页图片画廊（swiper） |
| ShopMap | 门店位置地图 |

## CONVENTIONS

- **组件结构**: 每个组件目录含 `index.ts`（逻辑）、`index.wxml`（模板）、`index.wxss`（样式）、`index.json`（配置）
- **API 调用**: `services/api.ts` 封装 `wx.request`，使用 `config/api.ts` 中的 API_BASE_URL
- **页面跳转**: 首页/分类用 `wx.switchTab`，详情页用 `wx.navigateTo`
- **Mock 数据**: `mock/data.ts` 作为本地开发回退
- **颜色主题**: 绿色系 `#2E7D32`（导航栏 + Tab 选中色），`#E8F5E9`（背景色）

## COMMANDS

```bash
# 微信开发者工具 → 导入 flower-shop-mini 目录
# 真机预览前需修改 config/api.ts 为局域网 IP 或 HTTPS 域名
# 并在微信小程序后台配置 request 合法域名
```
