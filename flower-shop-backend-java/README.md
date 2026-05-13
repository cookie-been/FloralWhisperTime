# 花语时光 Java 后端

这是 `flower-shop-backend` 的 Java + MySQL 重构版本，使用 Spring Boot 3、MyBatis-Plus、Flyway 和 JWT，接口保持兼容现有 Web 和小程序。

## 技术栈

- Java 17
- Spring Boot 3
- Spring Web MVC
- Spring Security
- MyBatis-Plus
- MySQL 8
- Flyway
- JWT
- Maven

## 准备 MySQL

```sql
CREATE DATABASE floral_whisper_time CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

如果本机没有 MySQL，可用 Docker 单独启动数据库：

```bash
docker compose -f docker-compose.mysql.yml up -d
```

默认连接配置：

```text
DB_URL=jdbc:mysql://localhost:3306/floral_whisper_time?useUnicode=true&characterEncoding=utf8&serverTimezone=Asia/Shanghai&allowPublicKeyRetrieval=true&useSSL=false
DB_USERNAME=root
DB_PASSWORD=root
```

启动时 Flyway 会自动创建表并写入初始数据。

## 启动

```bash
cd flower-shop-backend-java
mvn spring-boot:run
```

也可以显式传入数据库账号：

```bash
DB_USERNAME=root DB_PASSWORD=your_password mvn spring-boot:run
```

默认服务地址：

```text
http://localhost:3001
```

健康检查：

```bash
curl http://localhost:3001/api/health
```

Swagger：

```text
http://localhost:3001/swagger-ui.html
```

## 管理账号

默认：

- 账号：`admin`
- 密码：`Floral@2026`

生产环境请通过环境变量修改：

```bash
ADMIN_USERNAME=admin \
ADMIN_PASSWORD='your-password' \
ADMIN_AUTH_SECRET='replace-with-a-long-random-secret' \
mvn spring-boot:run
```

## 兼容接口

- `GET /api/health`
- `POST /api/admin/login`
- `GET /api/admin/me`
- `GET /api/flowers`
- `GET /api/flowers/{id}`
- `GET /api/flowers/{id}/related`
- `POST /api/flowers`
- `PUT /api/flowers/{id}`
- `DELETE /api/flowers/{id}`
- `POST /api/uploads`
- `GET /api/categories`
- `GET /api/site-config`
- `PUT /api/site-config`
- `GET /api/shop-info`
- `GET /api/brand-story`
- `GET /api/team`
- `POST /api/contact`
