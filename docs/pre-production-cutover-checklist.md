# 从本地开发切换到正式部署前检查清单

本文档用于在“本地开发完成，准备切换到正式服务器部署”前做一次收口检查。

## 1. 代码与分支

- 已提交本次改动
- 本地和远端分支状态清晰
- 需要交付的功能已经合并到正式分支
- 工作区干净

## 2. 后端验证

- 关键测试已通过
- `mvn package` 能成功
- `/api/health` 正常
- 管理员登录正常
- `/api/admin/system/status` 正常

## 3. 前端验证

- `tsc -b && vite build` 通过
- 首页、画廊、关于页、联系页能正常打开
- 后台登录和后台各菜单能正常进入
- 移动端主要页面没有明显错位

## 4. 安全项

- 默认管理员密码不会直接用于正式环境
- `ADMIN_AUTH_SECRET` 准备替换为正式随机值
- `APP_DATA_ENCRYPTION_KEY` 准备替换为正式随机值
- AI 配置中不保留测试密钥
- 后台“系统状态 -> 安全状态”逻辑已确认正常

## 5. 数据与内容

- 确认正式交付是否需要干净数据库
- 确认是否需要保留当前作品、留言、日志
- 确认首页、关于我们、团队、时间轴等内容是否已整理为正式版本
- 确认 AI 测试数据是否需要清理

## 6. 部署资料

- 发布包构建脚本可用
- 部署文档已更新
- `.env` 正式模板已准备
- Nginx / HTTPS 配置方案已准备

## 7. 上线前最后命令建议

本地建议先执行：

```bash
./release-check.sh
./ops/build-release.sh
```

如果是源码部署路径，至少执行：

```bash
cd flower-shop-backend-java && mvn test
cd /workspace/FloralWhisperTime && docker build -f flower-shop-web/Dockerfile.runtime .
```

## 8. 进入正式部署后

正式上线直接参考：

- [first-server-go-live.md](./first-server-go-live.md)
- [production-env-template.md](./production-env-template.md)
- [nginx-https-production-example.md](./nginx-https-production-example.md)
