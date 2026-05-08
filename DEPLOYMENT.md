# ChessMind — Complete Deployment Guide
# EC2 Instance: m7i-flex.large (2 vCPU, 8 GB RAM)
# OS: Ubuntu 22.04 LTS

# ═══════════════════════════════════════════════════════════════
# STEP 0: EC2 Setup — Security Group Inbound Rules
# ═══════════════════════════════════════════════════════════════
# Port 22   — SSH (your IP only)
# Port 80   — HTTP (0.0.0.0/0)
# Port 443  — HTTPS (0.0.0.0/0)   [if using SSL]
# Port 3000 — Next.js (optional, for direct access)
# Port 8080 — Backend (optional, for API testing)

# ═══════════════════════════════════════════════════════════════
# STEP 1: SSH into your EC2 instance
# ═══════════════════════════════════════════════════════════════
ssh -i your-key.pem ubuntu@<EC2-PUBLIC-IP>

# ═══════════════════════════════════════════════════════════════
# STEP 2: Install Dependencies
# ═══════════════════════════════════════════════════════════════
sudo apt update && sudo apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com | sudo sh
sudo usermod -aG docker ubuntu
newgrp docker

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" \
     -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose
docker-compose --version

# Install Java 17 (for building the backend locally if needed)
sudo apt install -y openjdk-17-jdk
java -version

# Install Node.js 20 (for building frontend locally if needed)
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
node --version

# ═══════════════════════════════════════════════════════════════
# STEP 3: Upload your project to EC2
# ═══════════════════════════════════════════════════════════════
# From your LOCAL machine (not EC2):
scp -i your-key.pem -r ./chess-webapp ubuntu@<EC2-PUBLIC-IP>:~/

# OR use git:
# git clone https://github.com/yourname/chess-webapp.git ~/chess-webapp

# ═══════════════════════════════════════════════════════════════
# STEP 4: Configure Environment Variables
# ═══════════════════════════════════════════════════════════════
cd ~/chess-webapp

# Generate a strong JWT secret
JWT_SECRET=$(openssl rand -base64 64 | tr -d '\n')
echo "JWT_SECRET: $JWT_SECRET"

# Create backend .env
cat > backend/.env << EOF
DB_HOST=mysql
DB_PORT=3306
DB_NAME=chessdb
DB_USER=chessuser
DB_PASSWORD=chesspassword_$(openssl rand -hex 8)
REDIS_HOST=redis
REDIS_PORT=6379
REDIS_PASSWORD=
OLLAMA_URL=http://ollama:11434
OLLAMA_MODEL=llama3
JWT_SECRET=${JWT_SECRET}
FRONTEND_URL=http://<EC2-PUBLIC-IP>:3000
EOF

# Create frontend .env.local
cat > frontend/.env.local << EOF
NEXT_PUBLIC_API_URL=http://<EC2-PUBLIC-IP>:8080
NEXT_PUBLIC_WS_URL=http://<EC2-PUBLIC-IP>:8080/ws
EOF

# Replace <EC2-PUBLIC-IP> with your actual IP
# e.g., sed -i 's/<EC2-PUBLIC-IP>/54.123.45.67/g' backend/.env frontend/.env.local

# ═══════════════════════════════════════════════════════════════
# STEP 5: Update docker-compose.yml to include frontend
# ═══════════════════════════════════════════════════════════════
# Add this service to backend/docker-compose.yml:
cat >> backend/docker-compose.yml << 'EOF'

  frontend:
    build:
      context: ../frontend
      dockerfile: Dockerfile
    container_name: chess-frontend
    restart: unless-stopped
    depends_on:
      - backend
    environment:
      NEXT_PUBLIC_API_URL: http://backend:8080
      NEXT_PUBLIC_WS_URL: http://backend:8080/ws
    ports:
      - "3000:3000"
EOF

# ═══════════════════════════════════════════════════════════════
# STEP 6: Pull Ollama Model
# ═══════════════════════════════════════════════════════════════
# Start Ollama container first
cd backend
docker-compose up -d ollama

# Wait for Ollama to be ready (about 30 seconds)
sleep 30

# Pull the llama3 model (this will take 5–10 minutes, ~4.7GB)
docker exec chess-ollama ollama pull llama3

# Verify it downloaded:
docker exec chess-ollama ollama list

# ═══════════════════════════════════════════════════════════════
# STEP 7: Build and Start All Services
# ═══════════════════════════════════════════════════════════════
cd ~/chess-webapp/backend

# Build all images and start services
docker-compose up -d --build

# Watch logs to ensure healthy startup
docker-compose logs -f

# Check all containers are running
docker-compose ps

# Expected output:
# chess-mysql     Up (healthy)
# chess-redis     Up (healthy)
# chess-ollama    Up
# chess-backend   Up
# chess-frontend  Up

# ═══════════════════════════════════════════════════════════════
# STEP 8: Verify Services
# ═══════════════════════════════════════════════════════════════
# Test backend health
curl http://localhost:8080/api/auth/me
# Expected: 401 Unauthorized (means backend is running)

# Test Ollama
curl http://localhost:11434/api/tags
# Expected: JSON list with llama3 model

# Test frontend
curl http://localhost:3000
# Expected: HTML

# Open in browser:
# http://<EC2-PUBLIC-IP>:3000

# ═══════════════════════════════════════════════════════════════
# STEP 9: (Optional) Set up Nginx Reverse Proxy on Port 80
# ═══════════════════════════════════════════════════════════════
sudo apt install -y nginx

sudo cat > /etc/nginx/sites-available/chessmind << 'NGINX'
server {
    listen 80;
    server_name _;

    # Frontend
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    # Backend API
    location /api/ {
        proxy_pass http://localhost:8080;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_read_timeout 60s;
    }

    # WebSocket
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

# Now access at: http://<EC2-PUBLIC-IP>

# ═══════════════════════════════════════════════════════════════
# STEP 10: Useful Management Commands
# ═══════════════════════════════════════════════════════════════
cd ~/chess-webapp/backend

# View logs
docker-compose logs -f backend
docker-compose logs -f frontend
docker-compose logs -f mysql

# Restart a single service
docker-compose restart backend
docker-compose restart frontend

# Stop everything
docker-compose down

# Stop + remove volumes (WIPES DATABASE)
docker-compose down -v

# Update after code changes
docker-compose up -d --build backend
docker-compose up -d --build frontend

# Connect to MySQL
docker exec -it chess-mysql mysql -u chessuser -p chessdb

# Connect to Redis CLI
docker exec -it chess-redis redis-cli

# Check Ollama models
docker exec chess-ollama ollama list

# ═══════════════════════════════════════════════════════════════
# TROUBLESHOOTING
# ═══════════════════════════════════════════════════════════════
# Backend won't start?
#   → docker-compose logs backend
#   → Check DB_HOST, DB_PASSWORD in .env

# Ollama returning garbage moves?
#   → This is normal for chess — LLMs aren't chess engines.
#   → Use EASY mode for pure random moves.
#   → Consider adding Stockfish for better AI.

# WebSocket not connecting?
#   → Check NEXT_PUBLIC_WS_URL points to correct IP
#   → Ensure port 8080 is open in EC2 Security Group
#   → Check Nginx WS proxy config above

# Database connection refused?
#   → Wait 30s after docker-compose up (MySQL takes time)
#   → docker-compose ps (check mysql is healthy)

# Out of disk space (llama3 is ~4.7GB)?
#   → Use a smaller model: ollama pull llama3.2:1b
#   → Update OLLAMA_MODEL=llama3.2:1b in .env
