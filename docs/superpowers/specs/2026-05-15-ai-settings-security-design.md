# AI 配置安全改造设计

## 目标

将 AI 配置从公开站点配置接口中剥离，避免 `apiKey` 和模型配置暴露给未登录用户，同时保持后台 AI 生图和 AI 作品信息建议能力可正常使用。

## 方案

- `GET /api/site-config` 不再返回 `aiSettings`
- 新增后台专用接口：
  - `GET /api/admin/system/ai-settings`
  - `PUT /api/admin/system/ai-settings`
- 后台 AI 配置页改用后台专用接口读取和保存
- 后台读取 AI 配置时不返回完整 `apiKey`，而返回：
  - `apiKeyConfigured`
  - `apiKeyMasked`
  - 其他非敏感配置字段

## 验证

- 公开接口无 `aiSettings`
- 未登录无法读取/修改 AI 配置
- 后台仍可修改 AI 配置
- AI 生图和 AI 建议功能正常
