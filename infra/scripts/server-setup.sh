#!/bin/bash
set -e

echo "=== Online Judge server setup ==="

echo "--- System packages ---"
sudo apt update
sudo apt upgrade -y
sudo apt install -y docker.io docker-compose-v2 nginx git certbot python3-certbot-nginx curl

echo "--- Docker ---"
sudo systemctl enable docker
sudo systemctl start docker
if ! groups "$USER" | grep -q docker; then
  sudo usermod -aG docker "$USER"
  echo "Added $USER to docker group — you must log out and back in (exit, then ssh again) before docker commands work without sudo."
fi

echo "--- Node.js 20 ---"
if ! command -v node &> /dev/null; then
  curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
  sudo apt install -y nodejs
else
  echo "Node.js already installed: $(node --version)"
fi

echo "--- pm2 ---"
if ! command -v pm2 &> /dev/null; then
  sudo npm install -g pm2
else
  echo "pm2 already installed"
fi

echo "--- Repo ---"
if [ -d "$HOME/online-judge/.git" ]; then
  cd "$HOME/online-judge"
  git pull origin main
else
  git clone https://github.com/thunderbolt3-14/online-judge.git "$HOME/online-judge"
  cd "$HOME/online-judge"
fi

echo "--- Home directory permission (required for Nginx to serve the frontend build) ---"
chmod o+rx "$HOME"

echo "--- Pulling judge language images ---"
docker pull python:3.11-alpine
docker pull gcc:13-bookworm
docker pull node:20-alpine
docker pull eclipse-temurin:21-jdk-alpine

echo "=== Base setup complete ==="
echo ""
echo "Still needed before the app is live:"
echo "  1. Create backend/.env, judge-worker/.env, frontend/.env.production"
echo "     (see infra/ENV_TEMPLATE.md for the exact content — copy/paste, don't retype from memory)"
echo "  2. docker compose up -d --build"
echo "  3. cd judge-worker && npm ci && pm2 start src/worker.js --name judge-worker && pm2 save && pm2 startup"
echo "     (run the sudo command pm2 startup prints)"
echo "  4. cd frontend && npm ci && npm run build"
echo "  5. Configure Nginx (see infra/ENV_TEMPLATE.md for the config block) + certbot for HTTPS"