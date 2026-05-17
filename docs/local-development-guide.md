# 本地开发环境说明

本文档面向当前“在本地 Linux 环境开发项目”的场景，说明推荐启动方式、常见目录和本地联调建议。

## 1. 推荐开发模式

本项目支持两种本地开发方式：

1. 容器整站启动
2. 前后端分别本地开发

如果你主要在改业务代码，推荐：

- MySQL 用 Docker
- Java 后端本地启动
- Web 前端本地启动

这样调试效率更高。

## 2. 最常用的本地开发组合

### 2.1 先启动 MySQL

如果本机没有独立 MySQL，可以先启动项目自带 MySQL：

```bash
docker compose -f docker-compose.mysql.yml up -d
```

### 2.2 启动 Java 后端

```bash
cd flower-shop-backend-java
mvn spring-boot:run
```

默认端口：

```text
http://localhost:3001
```

### 2.3 启动 Web 前端

```bash
cd flower-shop-web
npm install
npm run dev
```

默认地址：

```text
http://localhost:5173
```

前端开发时会通过 `VITE_API_BASE_URL` 调后端。

## 3. 一键容器启动方式

如果你想整站直接跑起来，也可以：

```bash
./deploy.sh
```

或：

```bash
docker compose up -d --build
```

这种方式更接近交付环境，但代码改动后的热更新体验不如本地前后端分开启动。

## 4. 常用开发地址

- 前台首页：`http://localhost:5173`
- 后端健康检查：`http://localhost:3001/api/health`
- Swagger：`http://localhost:3001/swagger-ui.html`
- 管理后台登录页：`http://localhost:5173/admin/login`

## 5. 本地默认账号

默认管理员：

```text
admin / Floral@2026
```

说明：

- 当前后端已支持首次登录强制改密
- 本地开发环境如果你改过密码，实际以后端数据库状态为准

## 6. 常用目录

### 后端

- `flower-shop-backend-java/src/main/java/`
- `flower-shop-backend-java/src/main/resources/`
- `flower-shop-backend-java/src/test/java/`

### 前端

- `flower-shop-web/src/pages/`
- `flower-shop-web/src/components/`
- `flower-shop-web/src/services/api.ts`

### 共享类型

- `shared/types.ts`

### 部署与交付

- `docs/`
- `ops/`

## 7. 本地开发建议

1. Web 构建前一定跑 `tsc -b && vite build`
2. 后端改鉴权、AI、系统状态时，优先跑相关测试类
3. 本地开发环境可以保留开发默认值，但不要把正式密钥写进仓库
4. 如果本地要模拟正式环境变量，单独建本地 `.env` 或 shell 导出变量

## 8. 相关文档

- [local-dev-env-example.md](./reference/local-dev-env-example.md)
- [pre-production-cutover-checklist.md](./pre-production-cutover-checklist.md)
- [first-server-go-live.md](./first-server-go-live.md)
