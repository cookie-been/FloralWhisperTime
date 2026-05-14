# flower-shop-web

React 19 + Vite 7 + Tailwind CSS 3 + Ant Design 6 Web 端，包含前台站点与后台管理界面。

## STRUCTURE

```
src/
├── components/
│   ├── auth/ProtectedAdminRoute.tsx   # 管理端路由守卫
│   ├── common/FlowerCard.tsx          # 花束卡片
│   ├── common/ImageGallery.tsx        # 图片画廊
│   └── layout/Layout.tsx              # 全局布局（导航栏 + Footer）
├── pages/
│   ├── Home/Home.tsx                  # 首页：Hero + 统计数据 + 精选作品 + 品牌故事
│   ├── Gallery/Gallery.tsx            # 作品画廊：分类筛选 + 排序 + 搜索
│   ├── FlowerDetail/FlowerDetail.tsx  # 作品详情：画廊 + 花材 + 寓意 + 相关推荐
│   ├── About/About.tsx                # 关于我们：品牌故事 + 团队 + 门店信息
│   ├── Contact/Contact.tsx            # 联系我们：地图 + 联系方式 + 留言表单
│   ├── AdminLogin/AdminLogin.tsx      # 管理登录
│   ├── AdminDashboard/AdminDashboard.tsx # 运营总览
│   ├── AdminFlowers/AdminFlowers.tsx  # 作品管理 CRUD
│   ├── AdminSettings/AdminSettings.tsx # 内容配置（首页/门店/关于我们）
│   └── AdminContacts/AdminContacts.tsx # 用户留言查看
├── router/index.tsx                   # React Router 路由配置
├── services/api.ts                    # API 请求封装（fetch + Bearer token）
├── types/index.ts                     # 本地类型定义（引用 @shared）
└── main.tsx                           # 入口：ConfigProvider + RouterProvider
```

## WHERE TO LOOK

| 任务 | 位置 |
|------|------|
| 新增页面 | `src/pages/*/` + `src/router/index.tsx` |
| 添加 API 调用 | `src/services/api.ts` |
| 修改全局主题 | `src/main.tsx` (Ant Design ConfigProvider) |
| 修改布局 | `src/components/layout/Layout.tsx` |
| 修改后台菜单 | `src/components/admin/adminMeta.ts` |

## CONVENTIONS

- **路径别名**: `@/` → `src/`，`@shared/` → `../shared/`
- **样式方案**: Tailwind utility classes + Ant Design 组件内联 token
- **API 封装**: `request<T>()` 泛型函数，自动注入 `Authorization` 头
- **管理端鉴权**: token 存 `localStorage`，`ProtectedAdminRoute` 拦截未认证访问
- **部署基线**: 本地开发可用 `VITE_API_BASE_URL`；Docker 部署默认走同源 `/api`
- **打包优化**: React/Ant Design/lucide-react 分别拆为独立 chunk

## COMMANDS

```bash
npm run dev      # vite --host 0.0.0.0
npm run build    # tsc -b && vite build
npm run preview  # vite preview --host 0.0.0.0
```

环境变量: `VITE_API_BASE_URL`（默认 `http://localhost:3001`）
