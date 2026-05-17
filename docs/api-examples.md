# 接口调用示例

本文档用于给二次开发、联调、售后排查和接口验证使用，示例以 `curl` 为主。

约定：

- 本地开发后端地址：`http://localhost:3001`
- 生产环境请替换为实际域名或站点地址
- 受保护接口需要先登录后台获取 Bearer Token

## 1. 健康检查

```bash
curl -X GET "http://localhost:3001/api/health"
```

## 2. 获取分类列表

```bash
curl -X GET "http://localhost:3001/api/categories"
```

## 3. 获取作品列表

```bash
curl -X GET "http://localhost:3001/api/flowers?page=1&limit=12&sortBy=featured"
```

## 4. 获取作品详情

```bash
curl -X GET "http://localhost:3001/api/flowers/wedding-001"
```

## 5. 获取站点配置

```bash
curl -X GET "http://localhost:3001/api/site-config"
```

## 6. 提交留言

```bash
curl -X POST "http://localhost:3001/api/contact" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "张三",
    "phone": "13800000000",
    "message": "想咨询婚礼花艺方案"
  }'
```

## 7. 管理员登录

```bash
curl -X POST "http://localhost:3001/api/admin/login" \
  -H "Content-Type: application/json" \
  -d '{
    "username": "admin",
    "password": "Floral@2026"
  }'
```

建议把返回的 token 保存到变量：

```bash
export TOKEN="替换成实际 token"
```

## 8. 获取当前管理员信息

```bash
curl -X GET "http://localhost:3001/api/admin/me" \
  -H "Authorization: Bearer $TOKEN"
```

## 9. 修改管理员密码

```bash
curl -X POST "http://localhost:3001/api/admin/change-password" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "currentPassword": "Floral@2026",
    "newPassword": "Floral@2026#New"
  }'
```

## 10. 获取后台作品列表

```bash
curl -X GET "http://localhost:3001/api/admin/flowers?page=1&limit=20&deleted=active" \
  -H "Authorization: Bearer $TOKEN"
```

## 11. 新增作品

```bash
curl -X POST "http://localhost:3001/api/flowers" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "id": "wedding-001",
    "name": "白绿婚礼手捧",
    "categoryId": "wedding",
    "images": ["/uploads/demo.jpg"],
    "price": 599,
    "description": "适合轻仪式感婚礼场景",
    "materials": ["白玫瑰", "尤加利"],
    "meaning": "纯净与陪伴",
    "tags": ["婚礼", "白绿"],
    "featured": true,
    "sort": 10,
    "createdAt": "2026-05-17T00:00:00.000Z"
  }'
```

## 12. 删除与恢复作品

删除：

```bash
curl -X DELETE "http://localhost:3001/api/flowers/wedding-001" \
  -H "Authorization: Bearer $TOKEN"
```

恢复：

```bash
curl -X POST "http://localhost:3001/api/admin/flowers/wedding-001/restore" \
  -H "Authorization: Bearer $TOKEN"
```

## 13. 上传图片

```bash
curl -X POST "http://localhost:3001/api/uploads" \
  -H "Authorization: Bearer $TOKEN" \
  -F "file=@/path/to/your-image.jpg"
```

## 14. 获取与更新 AI 配置

获取：

```bash
curl -X GET "http://localhost:3001/api/admin/system/ai-settings" \
  -H "Authorization: Bearer $TOKEN"
```

更新：

```bash
curl -X PUT "http://localhost:3001/api/admin/system/ai-settings" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "enabled": true,
    "provider": "volcengine",
    "apiKey": "your-api-key",
    "model": "doubao-seedream-5-0-260128",
    "baseUrl": "https://ark.cn-beijing.volces.com/api/v3",
    "generatePath": "/images/generations",
    "size": "1024x1280"
  }'
```

## 15. AI 生图

```bash
curl -X POST "http://localhost:3001/api/admin/ai/images/generate" \
  -H "Authorization: Bearer $TOKEN" \
  -F "prompt=一束白绿色现代婚礼手捧花"
```

## 16. AI 作品信息建议

```bash
curl -X POST "http://localhost:3001/api/admin/ai/flowers/suggestions" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "一束白绿色现代婚礼手捧花",
    "imageUrl": "/uploads/ai/ai-1747220000000-xxxx.png",
    "mode": "text_to_image"
  }'
```

## 17. 获取留言列表

```bash
curl -X GET "http://localhost:3001/api/admin/contacts?page=1&limit=20&status=unread&deleted=active" \
  -H "Authorization: Bearer $TOKEN"
```

## 18. 获取系统状态

```bash
curl -X GET "http://localhost:3001/api/admin/system/status" \
  -H "Authorization: Bearer $TOKEN"
```

## 19. 创建备份与巡检任务

创建备份：

```bash
curl -X POST "http://localhost:3001/api/admin/system/ops-tasks/backup" \
  -H "Authorization: Bearer $TOKEN"
```

创建巡检：

```bash
curl -X POST "http://localhost:3001/api/admin/system/ops-tasks/inspection" \
  -H "Authorization: Bearer $TOKEN"
```

## 20. 配置导出与导入

导出：

```bash
curl -X GET "http://localhost:3001/api/admin/system/config-export" \
  -H "Authorization: Bearer $TOKEN" \
  -o config-export.json
```

导入：

```bash
curl -X POST "http://localhost:3001/api/admin/system/config-import" \
  -H "Authorization: Bearer $TOKEN" \
  -F "file=@/path/to/config-export.json"
```

## 21. 操作日志与恢复

查询：

```bash
curl -X GET "http://localhost:3001/api/admin/operation-logs?page=1&limit=20" \
  -H "Authorization: Bearer $TOKEN"
```

恢复：

```bash
curl -X POST "http://localhost:3001/api/admin/operation-logs/123/restore" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "reason": "恢复误操作"
  }'
```

## 22. 建议配合阅读

- [接口文档](./api.md)
- [权限与安全说明](./security-and-permissions.md)
- [售后排障手册](./support-troubleshooting-manual.md)
