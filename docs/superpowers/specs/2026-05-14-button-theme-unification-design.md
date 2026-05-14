# 按钮背景统一设计

## 目标

统一前台与后台按钮的背景、边框、阴影、悬停态、按下态和禁用态，让整个系统的按钮语言保持同一套视觉规则。

## 范围

- 基于 Ant Design `Button` 主题 token 统一标准按钮
- 通过 `styles.css` 补齐项目中已有的自定义按钮类
- 保留前后台同一套设计语言，不分裂成两套主题

## 设计规则

- 主按钮：森绿色渐变背景，稳定边框和柔和阴影
- 默认按钮：浅米白背景，灰绿边框，轻微暖色 hover
- 危险按钮：低饱和红色背景和收敛阴影
- 文字按钮：透明背景，仅统一 hover 态
- 小尺寸操作按钮：与普通按钮共享背景和边框节奏
- 禁用态：降低对比和阴影，保留轮廓感

## 落点

- `flower-shop-web/src/main.tsx`
  - 调整 `ConfigProvider` 的 `Button` token
- `flower-shop-web/src/styles.css`
  - 统一 `.ant-btn`、`.ant-btn-primary`、`.ant-btn-dangerous`
  - 覆盖 `.admin-action-button`
  - 兼容 `gallery-search-button`

## 验证

- 前台：首页、画廊、联系页按钮统一
- 后台：登录页、总览、作品管理、内容配置、留言管理按钮统一
- `npm run build` 通过
- Docker Web 页面可正常加载
