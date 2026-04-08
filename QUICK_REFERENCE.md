# 🚀 SOKAPP Quick Deployment Reference

## 📦 Files Created for Docker Deployment

```
Version 3/
├── Dockerfile.backend          # Backend container (Node.js)
├── Dockerfile.frontend         # Frontend container (React + Nginx)
├── docker-compose.yml          # Orchestration file
├── nginx.conf                  # Nginx configuration for frontend
├── .env.example.docker         # Environment template
├── .dockerignore.backend       # Backend build exclusions
├── .dockerignore.frontend      # Frontend build exclusions
├── deploy.sh                   # Linux/Mac deployment script
├── deploy.bat                  # Windows deployment helper
├── DOCKER_DEPLOYMENT.md        # Complete deployment guide
└── QUICK_REFERENCE.md          # This file
```

## ⚡ 3-Step Deployment on VPS

### Step 1: Upload & Configure
```bash
# Upload your project to VPS
scp -r "Version 3" user@your-vps-ip:/opt/sokapp

# SSH into VPS
ssh user@your-vps-ip

# Navigate to project
cd /opt/sokapp/Version\ 3

# Configure environment
cp .env.example.docker .env
nano .env  # Update URLs and secrets
```

### Step 2: Deploy
```bash
# Make script executable and run
chmod +x deploy.sh
./deploy.sh
```

**OR manually:**
```bash
docker-compose up -d --build
```

### Step 3: Verify
```bash
# Check services
docker-compose ps

# View logs
docker-compose logs -f

# Test endpoints
curl http://localhost:5000/  # Backend
curl http://localhost:3000/  # Frontend
```

## 🔧 Essential Docker Commands

```bash
# View running services
docker-compose ps

# View logs (all services)
docker-compose logs -f

# View logs (specific service)
docker-compose logs -f backend
docker-compose logs -f frontend

# Restart services
docker-compose restart
docker-compose restart backend
docker-compose restart frontend

# Stop all services
docker-compose down

# Rebuild and restart
docker-compose up -d --build

# Update after code changes
git pull
docker-compose up -d --build

# Clean up old images
docker image prune -a

# Check resource usage
docker stats
```

## 🔑 Critical .env Variables

```env
# MUST UPDATE FOR PRODUCTION:
BACKEND_URL=http://YOUR_VPS_IP:5000
FRONTEND_URL=http://YOUR_VPS_IP:3000
SESSION_SECRET=<generate-secure-key>

# DATABASE (Already configured for Aiven):
DB_HOST=mysql-cc55f8d-sahlesokem6-d640.i.aivencloud.com
DB_PORT=11873
DB_USER=avnadmin
DB_PASSWORD=AVNS_-OrW1c2_hjLs8sCxFnk
DB_NAME=sokapp

# EMAIL (Optional):
BREVO_API_KEY=your-api-key
```

**Generate secure session secret:**
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

## 🌐 Production Setup with Domain

### 1. Update .env
```env
BACKEND_URL=https://api.yourdomain.com
FRONTEND_URL=https://yourdomain.com
```

### 2. Rebuild
```bash
docker-compose up -d --build
```

### 3. Setup Nginx Reverse Proxy
```bash
sudo apt install nginx certbot python3-certbot-nginx -y
sudo nano /etc/nginx/sites-available/sokapp
# Add configuration (see DOCKER_DEPLOYMENT.md)
sudo ln -s /etc/nginx/sites-available/sokapp /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
sudo certbot --nginx -d yourdomain.com -d api.yourdomain.com
```

## 🐛 Troubleshooting

### Backend won't start
```bash
# Check logs
docker-compose logs backend

# Common issues:
# 1. Database connection failed - check Aiven credentials
# 2. Port 5000 already in use - change port in docker-compose.yml
# 3. Missing environment variables - verify .env file
```

### Frontend can't reach backend
```bash
# Ensure BACKEND_URL in .env matches exactly
# Check CORS settings
# Verify backend is running: docker-compose ps
```

### Database connection issues
```bash
# Test connection from VPS
mysql -h mysql-cc55f8d-sahlesokem6-d640.i.aivencloud.com \
      -P 11873 -u avnadmin -p

# Check Aiven firewall allows your VPS IP
```

### Rebuild from scratch
```bash
docker-compose down
docker system prune -a
docker-compose up -d --build
```

## 📊 Architecture

```
User Browser
    ↓
┌──────────────────┐
│  Frontend        │  Port 3000
│  (React+Nginx)   │
└────────┬─────────┘
         ↓ HTTP API calls
┌──────────────────┐
│  Backend         │  Port 5000
│  (Node.js)       │
└────────┬─────────┘
         ↓ SQL
┌──────────────────┐
│  Aiven MySQL     │  External
│  (Cloud DB)      │
└──────────────────┘
```

**No database volume needed** - Using external Aiven database!

## 🔒 Security Checklist

- [ ] Updated SESSION_SECRET with strong random value
- [ ] Set correct BACKEND_URL and FRONTEND_URL
- [ ] Enabled firewall (ufw) on VPS
- [ ] Set up HTTPS with Let's Encrypt
- [ ] Never committed .env to Git
- [ ] Brevo API key configured (if using email)
- [ ] Regular Docker updates scheduled

## 📝 Common Ports

| Service | Container Port | Host Port | Protocol |
|---------|---------------|-----------|----------|
| Frontend | 80 | 3000 | HTTP |
| Backend | 5000 | 5000 | HTTP |
| Aiven DB | External | N/A | MySQL |

## 🎯 Next Steps After Deployment

1. ✅ Test all features
2. ✅ Set up domain name
3. ✅ Configure HTTPS
4. ✅ Set up monitoring
5. ✅ Configure automated backups (Aiven)
6. ✅ Set up CI/CD pipeline
7. ✅ Document custom configurations

## 📞 Need Help?

```bash
# Full deployment guide
cat DOCKER_DEPLOYMENT.md

# Check service health
docker inspect --format='{{.State.Health.Status}}' sokapp-backend
docker inspect --format='{{.State.Health.Status}}' sokapp-frontend

# Access container shell
docker exec -it sokapp-backend sh
docker exec -it sokapp-frontend sh
```

---

**Deploy with confidence! 🚀**
