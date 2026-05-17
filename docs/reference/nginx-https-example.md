# Nginx HTTPS 反向代理示例

本文档用于生产环境将 `花语时光` Docker 服务挂到标准域名与 HTTPS 入口，适合部署在 Linux 云主机或企业内网服务器。

## 目标拓扑

- `Nginx`：监听 `80/443`，负责 TLS、域名入口与反向代理
- `flower-shop-web`：Docker 内部 Web 服务，默认通常暴露在宿主机 `127.0.0.1:8080`
- `flower-shop-backend-java`：由 Web 容器继续同源代理 `/api` 与 `/uploads`

建议外部只开放：

- `80/tcp`
- `443/tcp`

不建议直接暴露：

- `3306`
- `3001`
- `8080`（如实际 WEB 端口不同，则替换为真实暴露端口）

## 部署前提

1. 先用一键部署脚本启动业务服务：

```bash
./deploy.sh --env-file .env.production --env-template .env.production.example
```

2. 确认站点仅绑定在本机或内网地址。

如果希望只允许 Nginx 访问 Web 端口，建议在 `.env.production` 中明确设置 `WEB_PORT`，并通过防火墙限制外部访问。

## HTTP + HTTPS 配置示例

示例域名：`flowers.example.com`

示例证书路径：

- `/etc/letsencrypt/live/flowers.example.com/fullchain.pem`
- `/etc/letsencrypt/live/flowers.example.com/privkey.pem`

建议配置文件：`/etc/nginx/conf.d/floral-whisper-time.conf`

```nginx
server {
    listen 80;
    listen [::]:80;
    server_name flowers.example.com;

    location /.well-known/acme-challenge/ {
        root /var/www/certbot;
    }

    location / {
        return 301 https://$host$request_uri;
    }
}

server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name flowers.example.com;

    ssl_certificate     /etc/letsencrypt/live/flowers.example.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/flowers.example.com/privkey.pem;
    ssl_session_timeout 1d;
    ssl_session_cache shared:SSL:10m;
    ssl_session_tickets off;

    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers off;

    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Frame-Options SAMEORIGIN always;
    add_header X-Content-Type-Options nosniff always;
    add_header Referrer-Policy strict-origin-when-cross-origin always;

    client_max_body_size 25m;

    location / {
        proxy_pass http://127.0.0.1:<WEB_PORT>;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_read_timeout 120s;
        proxy_send_timeout 120s;
    }
}
```

说明：

- 前端静态资源、`/api`、`/uploads` 都统一从 `http://127.0.0.1:<WEB_PORT>` 进入
- Web 容器内部已经处理 `/api` 和 `/uploads` 的后端转发，这里不需要再拆第二层路由
- `client_max_body_size 25m` 兼容后台 AI 参考图上传场景

## 证书签发示例

如使用 `certbot`：

```bash
sudo mkdir -p /var/www/certbot
sudo certbot certonly --webroot -w /var/www/certbot -d flowers.example.com
```

证书签发后检查并重载：

```bash
sudo nginx -t
sudo systemctl reload nginx
```

## 推荐防火墙策略

仅放行：

```bash
80/tcp
443/tcp
22/tcp
```

阻止公网直接访问应用端口：

```bash
<WEB_PORT>/tcp
3001/tcp
3306/tcp
```

## 联调检查

完成后按顺序执行：

```bash
curl -I http://flowers.example.com
curl -I https://flowers.example.com
curl -I https://flowers.example.com/api/health
```

预期结果：

- `http://` 跳转到 `https://`
- 首页返回 `200`
- `/api/health` 返回 `200`

再登录后台检查：

- `/admin/system` 可正常加载
- 最近备份下载可用
- AI 生图上传不被 Nginx 请求体限制拦截
