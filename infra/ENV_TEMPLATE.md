# Environment File Templates & Deployment Guide

This document serves as the  reference for configuring environment variables, setting up Nginx, executing redeployments, and fixing secret scanning push rejections.

> **CRITICAL SECURITY NOTE:** 
> NEVER commit real passwords, JWT secrets, or API keys to this file or any Git repository. Always fill in real values locally on the production server (`.env` files) and keep placeholders in this template.

---

## Environment File Templates

Fill in the `<...>` placeholders on the server (`nano .env`).

### `backend/.env`
```env
PORT=5000
MONGO_URI=mongodb+srv://<db_user>:<db_password>@<cluster_address>/<db_name>?appName=<app_name>
JWT_SECRET=<your_generated_jwt_secret_key>
JWT_EXPIRES_IN=7d
REDIS_URL=redis://redis:6379
FRONTEND_URL=https://<sslip-hostname>/
GEMINI_API_KEY=<your_gemini_api_key>
```

### `judge-worker/.env`
```env
MONGO_URI=mongodb+srv://<db_user>:<db_password>@<cluster_address>/<db_name>?appName=<app_name>
REDIS_URL=redis://localhost:6379
```

### `frontend/.env.production`
```env
VITE_API_URL=https://<sslip-hostname>/api
VITE_SOCKET_URL=https://<sslip-hostname>
```

---

## Part 3: Nginx Configuration

File location on server: `/etc/nginx/sites-available/online-judge`

```nginx
server {
    listen 80;
    server_name <sslip-hostname>;

    root /home/ubuntu/online-judge/frontend/dist;
    index index.html;

    location / {
        try_files $uri /index.html;
    }

    location /api/ {
        proxy_pass http://localhost:5000/api/;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location /socket.io/ {
        proxy_pass http://localhost:5000/socket.io/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location /grafana/ {
        proxy_pass http://localhost:3001/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

### Nginx Activation Commands
```bash
sudo ln -s /etc/nginx/sites-available/online-judge /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl reload nginx
sudo certbot --nginx -d <sslip-hostname>
```

---

## Part 4: Full Redeploy Sequence

Execute these steps whenever the EC2 instance is recreated and `terraform apply` gives a new public IP.

1. **Calculate `<sslip-hostname>`:**
   Convert your new public IP (e.g., `16.112.249.157`) to dashes format: `16-112-249-157.sslip.io`.

2. **SSH into EC2 Instance:**
   ```bash
   ssh -i ~/.ssh/id_rsa ubuntu@<new-ip>
   ```

3. **Run Server Setup Script:**
   ```bash
   curl -fsSL [https://raw.githubusercontent.com/thunderbolt3-14/online-judge/main/infra/scripts/server-setup.sh](https://raw.githubusercontent.com/thunderbolt3-14/online-judge/main/infra/scripts/server-setup.sh) | bash
   ```

4. **Re-login to refresh group permissions (Docker):**
   ```bash
   exit
   ssh -i ~/.ssh/id_rsa ubuntu@<new-ip>
   ```

5. **Create & Populate Environment Files:**
   ```bash
   cd ~/online-judge/backend && nano .env
   cd ~/online-judge/judge-worker && nano .env
   cd ~/online-judge/frontend && nano .env.production
   ```

6. **Build and Launch Application Containers:**
   ```bash
   cd ~/online-judge
   docker compose up -d --build
   
   cd judge-worker
   npm ci
   pm2 start src/worker.js --name judge-worker
   pm2 save
   pm2 startup
   # Run the exact sudo command output by 'pm2 startup'
   
   cd ../frontend
   npm ci
   npm run build
   ```

7. **Configure Nginx and Enable SSL:**
   Create `/etc/nginx/sites-available/online-judge` using the Nginx block above, replace `<sslip-hostname>`, then run:
   ```bash
   sudo ln -s /etc/nginx/sites-available/online-judge /etc/nginx/sites-enabled/
   sudo rm -f /etc/nginx/sites-enabled/default
   sudo nginx -t
   sudo systemctl reload nginx
   sudo certbot --nginx -d <sslip-hostname>
   ```

8. **Verify Access:**
   * App: `https://<sslip-hostname>`
   * Grafana: `https://<sslip-hostname>/grafana/`


### Grafana Gotchas (Phase 11c)
- `GF_SERVER_PROTOCOL` must stay `http` — Grafana's own listener never terminates TLS; Nginx does that and proxies internally over plain HTTP. Setting this to `https` causes: "Client sent an HTTP request to an HTTPS server."
- Nginx's `location /grafana/` block must `proxy_pass http://` (not `https://`) to match.
- `GF_SECURITY_ADMIN_USER`/`GF_SECURITY_ADMIN_PASSWORD` only seed the admin account on first-ever DB init — they do nothing on `--force-recreate` if the volume persists. To reset a forgotten password:
  `docker exec -it oj-grafana grafana cli admin reset-admin-password <newpass>`
