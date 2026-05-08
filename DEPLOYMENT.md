# ChessMind — Complete Deployment Guide

> **Stack:** Java 17 · Spring Boot 3 · Next.js 14 · MySQL 8 · Redis 7 · Ollama (llama3) · Docker
> **Target:** Any Ubuntu 22.04 / 24.04 server (AWS EC2 m7i-flex.large recommended)

---

## Prerequisites

| Requirement | Minimum |
|---|---|
| OS | Ubuntu 22.04 LTS or 24.04 LTS |
| RAM | 8 GB |
| CPU | 2 vCPU |
| Disk | 20 GB free (llama3 model alone is 4.7 GB) |
| Ports open | 22, 3000, 8080 |

---

## Part 1 — Server Setup

### 1.1 Update the system

```bash
sudo apt update && sudo apt upgrade -y
```

### 1.2 Install Docker

```bash
curl -fsSL https://get.docker.com | sudo sh
sudo usermod -aG docker $USER
newgrp docker

# Verify
docker --version
# Docker version 24.x or higher
```

### 1.3 Install Docker Compose plugin

```bash
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" \
     -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Verify
docker compose version
# Docker Compose version v2.x
```

---

## Part 2 — Get the Code

### 2.1 Clone the repository

```bash
git clone https://github.com/Rohit-1920/Chess.git
cd Chess
ls
# You should see: backend/  frontend/  docker-compose.yml  .env.example  DEPLOYMENT.md
```

---

## Part 3 — Configure Environment Variables

### 3.1 Get your server's public IP

```bash
curl -s http://checkip.amazonaws.com
# Example output: 13.201.41.227
# Save this IP — you will use it in the next steps
```

### 3.2 Generate a secure JWT secret

```bash
JWT_SECRET=$(openssl rand -base64 64 | tr -d '\n')
echo $JWT_SECRET
# Copy this output — you will need it below
```

### 3.3 Create the root `.env` file

```bash
# Replace YOUR_SERVER_IP with the IP from Step 3.1
# Replace YOUR_JWT_SECRET with the value from Step 3.2

cat > ~/Chess/.env << EOF
EC2_IP=YOUR_SERVER_IP
DB_USER=chessuser
DB_PASSWORD=chess_secure_pass_123
MYSQL_ROOT_PASSWORD=root_secure_pass_123
JWT_SECRET=YOUR_JWT_SECRET
NEXT_PUBLIC_API_URL=http://YOUR_SERVER_IP:8080
NEXT_PUBLIC_WS_URL=http://YOUR_SERVER_IP:8080/ws
EOF
```

Example with real values:
```bash
cat > ~/Chess/.env << EOF
EC2_IP=13.201.41.227
DB_USER=chessuser
DB_PASSWORD=chess_secure_pass_123
MYSQL_ROOT_PASSWORD=root_secure_pass_123
JWT_SECRET=D8XySoISa3jboj/w03hENvKv/yYD/dwWGZyD6vyzeg8aq23mn5ldLv7+j1L3pPpEe+p6n1iIQsgipQS/9wnLpw==
NEXT_PUBLIC_API_URL=http://13.201.41.227:8080
NEXT_PUBLIC_WS_URL=http://13.201.41.227:8080/ws
EOF
```

### 3.4 Create the backend `.env` file

```bash
# Replace YOUR_SERVER_IP and YOUR_JWT_SECRET with your actual values

cat > ~/Chess/backend/.env << EOF
DB_HOST=mysql
DB_PORT=3306
DB_NAME=chessdb
DB_USER=chessuser
DB_PASSWORD=chess_secure_pass_123
REDIS_HOST=redis
REDIS_PORT=6379
REDIS_PASSWORD=
OLLAMA_URL=http://ollama:11434
OLLAMA_MODEL=llama3
JWT_SECRET=YOUR_JWT_SECRET
FRONTEND_URL=http://YOUR_SERVER_IP:3000
EOF
```

### 3.5 Verify both files

```bash
cat ~/Chess/.env
cat ~/Chess/backend/.env
# Make sure your real IP and JWT secret appear in both files
```

---

## Part 4 — Pull the AI Model

### 4.1 Start Ollama container

```bash
cd ~/Chess
docker compose up -d ollama
sleep 20
```

### 4.2 Check disk space first

```bash
df -h /
# You need at least 6 GB free for llama3
# If less than 6 GB free, use the smaller model (see note below)
```

### 4.3 Pull llama3 (default — 4.7 GB, takes 5–10 minutes)

```bash
docker exec chess-ollama ollama pull llama3
```

Wait for `success` to appear. Then verify:

```bash
docker exec chess-ollama ollama list
# Should show llama3 with size ~4.7 GB
```

> **If disk space is low (less than 6 GB free)** use the 1 GB model instead:
> ```bash
> docker exec chess-ollama ollama pull llama3.2:1b
> # Then update backend/.env:
> sed -i 's/OLLAMA_MODEL=llama3/OLLAMA_MODEL=llama3.2:1b/' ~/Chess/backend/.env
> ```

---

## Part 5 — Build and Launch

### 5.1 Build all Docker images and start all services

```bash
cd ~/Chess
docker compose up -d --build
```

> **This takes 8–15 minutes on first run.** It is:
> - Downloading Maven + Java base images
> - Compiling 44 Java source files
> - Downloading npm packages
> - Building the Next.js production app
>
> Subsequent runs use cache and take under 1 minute.

### 5.2 Watch the logs

```bash
docker compose logs -f
# Press Ctrl+C to stop watching (containers keep running)
```

### 5.3 Check all containers are running

```bash
docker compose ps
```

Expected output — all 5 containers must show `Up`:

```
NAME               IMAGE                  STATUS
chess-mysql        mysql:8.0              Up (healthy)
chess-redis        redis:7-alpine         Up (healthy)
chess-ollama       ollama/ollama:latest   Up
chess-backend      chess-backend:latest   Up (healthy)
chess-frontend     chess-frontend:latest  Up
```

> **If any container shows `unhealthy` or `Exiting`**, run:
> ```bash
> docker compose up -d
> # MySQL sometimes needs a second attempt on first boot — this is normal
> ```

---

## Part 6 — Verify Everything Works

### 6.1 Test the backend API

```bash
curl http://localhost:8080/api/auth/me
# Expected: {"success":false,"message":"..."} with HTTP 401
# 401 = correct — it means backend is running and auth is working
```

### 6.2 Test the frontend

```bash
curl -I http://localhost:3000
# Expected: HTTP/1.1 200 OK
```

### 6.3 Test Ollama

```bash
curl http://localhost:11434/api/tags
# Expected: JSON listing llama3 model
```

---

## Part 7 — Open in Browser

```
http://YOUR_SERVER_IP:3000
```

Example: `http://13.201.41.227:3000`

---

## Part 8 — AWS Security Group (EC2 Only)

If deploying on AWS EC2, make sure these inbound rules exist:

1. Go to **AWS Console → EC2 → Instances → your instance**
2. Click **Security → Security groups → Edit inbound rules**
3. Add:

| Type | Protocol | Port | Source |
|---|---|---|---|
| SSH | TCP | 22 | Your IP |
| Custom TCP | TCP | 3000 | 0.0.0.0/0 |
| Custom TCP | TCP | 8080 | 0.0.0.0/0 |

4. Click **Save rules**

---

## Part 9 — (Optional) Nginx on Port 80

To serve the app on port 80 instead of 3000:

```bash
sudo apt install -y nginx

sudo tee /etc/nginx/sites-available/chessmind << 'NGINX'
server {
    listen 80;
    server_name _;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    location /api/ {
        proxy_pass http://localhost:8080;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_read_timeout 60s;
    }

    location /ws/ {
        proxy_pass http://localhost:8080;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "Upgrade";
        proxy_set_header Host $host;
        proxy_read_timeout 3600s;
    }
}
NGINX

sudo ln -s /etc/nginx/sites-available/chessmind /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t && sudo systemctl restart nginx
```

Now open: `http://YOUR_SERVER_IP` (no port number needed)

Also add port 80 to your AWS Security Group inbound rules.

---

## Management Commands

```bash
# View all running containers
docker compose ps

# View logs for all services
docker compose logs -f

# View logs for one service only
docker compose logs -f backend
docker compose logs -f frontend
docker compose logs -f mysql

# Restart one service
docker compose restart backend
docker compose restart frontend

# Stop all services (data is preserved)
docker compose down

# Stop all services AND delete all data (fresh start)
docker compose down -v

# Rebuild and restart after code changes
docker compose up -d --build

# Check disk usage
docker system df
```

---

## Troubleshooting

### Backend won't start
```bash
docker compose logs backend | tail -50
# Common causes:
# - MySQL not ready yet → run: docker compose up -d (again)
# - Wrong DB_PASSWORD in backend/.env
# - JWT_SECRET missing or too short
```

### Frontend shows blank page or 502
```bash
docker compose logs frontend | tail -50
# Common causes:
# - NEXT_PUBLIC_API_URL has wrong IP in .env
# - Backend not running → check: curl http://localhost:8080/api/auth/me
```

### MySQL keeps restarting
```bash
docker compose logs mysql | tail -30
# Common causes:
# - Corrupt volume from previous failed start
# Fix: docker compose down -v && docker compose up -d --build
```

### Ollama returns bad chess moves
This is expected. LLMs are not chess engines. The app uses:
- **Easy:** Pure random legal moves (always works)
- **Medium/Hard:** Ollama (may make mistakes — that's intentional for those levels)

### Check all container health
```bash
docker inspect chess-mysql | grep -A5 '"Health"'
docker inspect chess-backend | grep -A5 '"Health"'
```

### Free up disk space
```bash
docker system prune -f
# Removes stopped containers, unused images, unused networks
```

---

## Application URLs

| Service | URL |
|---|---|
| Frontend (app) | `http://YOUR_SERVER_IP:3000` |
| Backend API | `http://YOUR_SERVER_IP:8080/api` |
| Ollama API | `http://YOUR_SERVER_IP:11434` |

---

## First Time Using the App

1. Open `http://YOUR_SERVER_IP:3000`
2. Click **Get Started** or **Register**
3. Sign up with email or phone number
4. Set your username
5. Click **New Game** on the dashboard
6. Choose: **vs AI**, **Local 2-Player**, or **Online**
7. Select difficulty and board theme
8. Play chess!
