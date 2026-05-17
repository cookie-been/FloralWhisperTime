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

当前构建约束：

- 不能跳过 `tsc -b`
- 路由页面默认按 `React.lazy` 懒加载
- `vite.config.ts` 仅手动拆分 `react`、`router`、`icons`
- 其余依赖保持 Vite 默认策略，避免对 `antd` / `rc-*` 做激进手工切包

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
- `/admin/system` 运维中心
- `/admin/operation-logs` 操作日志
- `/admin/contacts` 用户留言

## 后台结构

后台由 `AdminShell` 承载，当前主要特征：

- 左侧一级导航
- 顶部“已打开页面”导航条，可快速切换
- 当前打开页签保存在本地存储中
- 页面标题、副标题、说明文案支持动态配置
- 大页面优先拆为 Tabs 结构，减少长滚动

当前后台重点页面：

- `站点配置`
  - 首页与品牌
  - 门店与联系
  - 品牌故事
  - 关于我们
  - 后台文案
  - 媒体资源
- `运维中心`
  - 总览
  - 备份与下载
  - 巡检与任务
  - 安全与风险
  - 日志归档
  - 配置迁移

## 前端公共工具

这轮前端规整后，Web 端新增了一组通用工具，优先复用：

- `src/utils/storage.ts`
  - 安全读写后台本地存储
- `src/utils/datetime.ts`
  - 日期展示、时间戳、当前时间格式化
- `src/utils/query-tabs.ts`
  - Tabs 与查询参数同步
- `src/utils/admin-display.ts`
  - 后台模块 / 动作 / 目标类型展示文案
- `src/utils/admin-status.tsx`
  - 后台常用状态 Tag
- `src/utils/admin-table.ts`
  - 后台表格分页、批量选择、批量结果汇总等公共工具
- `src/utils/dom.ts`
  - 表格行点击忽略规则
- `src/utils/list-text.ts`
  - 多行 / 逗号文本与数组互转
- `src/utils/text.ts`
  - 文本截断
- `src/utils/clipboard.ts`
  - 复制到剪贴板

后台大页面内部也已开始按页面局部 helper 拆分：

- `src/pages/AdminOperationLogs/operation-log.helpers.ts`
- `src/pages/AdminContacts/contact.helpers.ts`
- `src/pages/AdminFlowers/flower-list.helpers.ts`
- `src/pages/AdminSystemStatus/system-status.actions.ts`
- `src/pages/AdminSystemStatus/system-status.helpers.ts`
- `src/pages/AdminSystemStatus/system-status.constants.ts`

拆分原则：

- 页面本体优先只保留状态、生命周期、事件绑定和最终渲染结构
- 纯筛选、纯统计、纯映射、批量处理结果汇总优先下沉到 helper 或 `src/utils/`
- 后台表格类页面尽量复用同一套批量选择和批量反馈模式

## 数据

Web 端通过 `src/services/api.ts` 请求后端。

- 开发态默认走 `http://localhost:3001`
- Docker 部署态默认走同源 `/api`

后台当前支持：

- 作品新增、编辑、删除、上传图片
- 首页与门店内容维护
- 关于我们页内容维护
- 用户留言查看与已读处理
- 运维中心查看状态、备份、巡检、配置迁移、日志归档
- 操作日志筛选、查看详情、按快照恢复
