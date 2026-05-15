# Nginx + HTTPS 正式环境示例

本文档给出一份更贴近正式上线的 Nginx 配置示例，适合新服务器首次上线时直接参考。

## 1. 目标拓扑

- Docker Web 服务监听宿主机：`127.0.0.1:8080`
- Nginx 监听公网：`80/443`
- 域名示例：`flowers.example.com`

外部只开放：

- `80/tcp`
- `443/tcp`
- `22/tcp`

不要直接暴露：

- `8080`
- `3001`
- `3306`

## 2. 配套 `.env`

建议：

```dotenv
WEB_PORT=8080
PUBLIC_BASE_URL=https://flowers.example.com
CORS_ALLOWED_ORIGIN_PATTERNS=https://flowers.example.com,https://www.flowers.example.com
```

## 3. Nginx 配置示例

建议文件：

```text
/etc/nginx/conf.d/floralwhispertime.conf
```

配置内容：

```nginx
server {
    listen 80;
    listen [::]:80;
    server_name flowers.example.com www.flowers.example.com;

    location /.well-known/acme-challenge/ {
        root /var/www/certbot;
    }

    location / {
        return 301 https://flowers.example.com$request_uri;
    }
}

server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name flowers.example.com;

    ssl_certificate /etc/letsencrypt/live/flowers.example.com/fullchain.pem;
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
        proxy_pass http://127.0.0.1:8080;
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

- Web 容器已经处理前端、`/api` 和 `/uploads`，Nginx 不需要再单独拆 API 路由
- `client_max_body_size 25m` 用于兼容后台 AI 参考图上传

## 4. 证书申请示例

```bash
sudo mkdir -p /var/www/certbot
sudo certbot certonly --webroot -w /var/www/certbot -d flowers.example.com -d www.flowers.example.com
```

## 5. 重载 Nginx

```bash
sudo nginx -t
sudo systemctl reload nginx
```

## 6. 联调检查

```bash
curl -I http://flowers.example.com
curl -I https://flowers.example.com
curl -I https://flowers.example.com/api/health
```

预期：

- `http://` 跳转到 `https://`
- 首页 `200`
- `/api/health` 返回 `200`

## 7. 上线后人工检查

1. 首页打开正常
2. 后台登录正常
3. 后台“系统状态”打开正常
4. AI 图片上传不被 Nginx 拦截
5. 下载最近备份可用

## 8. 参考文档

- [first-server-go-live.md](./first-server-go-live.md)
- [production-env-template.md](./production-env-template.md)
- [release-package-deployment.md](./release-package-deployment.md)
