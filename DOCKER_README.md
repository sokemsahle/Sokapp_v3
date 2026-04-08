# 🐳 SOKAPP Docker Deployment

Complete Docker setup for deploying SOKAPP on your VPS with external Aiven database.

## 📁 What's Included

| File | Purpose |
|------|---------|
| `Dockerfile.backend` | Backend container (Node.js/Express) |
| `Dockerfile.frontend` | Frontend container (React + Nginx) |
| `docker-compose.yml` | Orchestrates both services |
| `nginx.conf` | Nginx configuration for React app |
| `.env.example.docker` | Environment variables template |
| `deploy.sh` | Automated deployment script (Linux/Mac) |
| `deploy.bat` | Deployment helper (Windows) |
| `DOCKER_DEPLOYMENT.md` | Complete deployment guide |
| `QUICK_REFERENCE.md` | Quick command reference |

## 🚀 Quick Start

### On Your VPS (Linux)

```bash
# 1. Clone/upload your project
cd /path/to/Version\ 3

# 2. Configure environment
cp .env.example.docker .env
nano .env  # Update BACKEND_URL, FRONTEND_URL, SESSION_SECRET

# 3. Deploy
chmod +x deploy.sh
./deploy.sh
```

### On Windows (Local Testing)

```cmd
# Run deployment helper
deploy.bat
```

## 📖 Full Documentation

- **[DOCKER_DEPLOYMENT.md](DOCKER_DEPLOYMENT.md)** - Complete step-by-step deployment guide
- **[QUICK_REFERENCE.md](QUICK_REFERENCE.md)** - Essential commands and troubleshooting

## 🏗️ Architecture

```
┌─────────────┐
│  Frontend   │ Port 3000 (Nginx serving React)
│  (React)    │
└──────┬──────┘
       │
       │ API Requests
       ▼
┌─────────────┐
│  Backend    │ Port 5000 (Node.js/Express)
│  (API)      │
└──────┬──────┘
       │
       │ SQL Queries (External)
       ▼
┌─────────────┐
│  Aiven DB   │ MySQL Cloud Database
│  (External) │ No volume needed!
└─────────────┘
```

## ⚙️ Configuration

### Required Environment Variables

Create `.env` file from `.env.example.docker`:

```env
# Application URLs (Update for your VPS)
BACKEND_URL=http://YOUR_VPS_IP:5000
FRONTEND_URL=http://YOUR_VPS_IP:3000

# Session Security
SESSION_SECRET=<generate-secure-random-key>

# Database (Aiven - Already configured)
DB_HOST=mysql-cc55f8d-sahlesokem6-d640.i.aivencloud.com
DB_PORT=11873
DB_USER=avnadmin
DB_PASSWORD=AVNS_-OrW1c2_hjLs8sCxFnk
DB_NAME=sokapp

# Email (Optional - Brevo)
BREVO_API_KEY=your-api-key
```

**Generate secure session secret:**
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

## 🔧 Common Commands

```bash
# Start services
docker-compose up -d --build

# View logs
docker-compose logs -f

# Stop services
docker-compose down

# Restart services
docker-compose restart

# Update deployment
git pull && docker-compose up -d --build

# Check status
docker-compose ps
```

## 🌐 Production Deployment

### With Domain & HTTPS

1. **Update `.env` with your domain:**
```env
BACKEND_URL=https://api.yourdomain.com
FRONTEND_URL=https://yourdomain.com
```

2. **Rebuild:**
```bash
docker-compose up -d --build
```

3. **Setup Nginx reverse proxy + SSL:**
```bash
sudo apt install nginx certbot python3-certbot-nginx -y
# Configure Nginx (see DOCKER_DEPLOYMENT.md)
sudo certbot --nginx -d yourdomain.com -d api.yourdomain.com
```

## 🐛 Troubleshooting

### Services won't start
```bash
# Check logs
docker-compose logs backend
docker-compose logs frontend

# Rebuild from scratch
docker-compose down
docker-compose build --no-cache
docker-compose up -d
```

### Can't connect to database
```bash
# Verify Aiven credentials in .env
# Ensure VPS IP is allowed in Aiven firewall
# Test connection:
mysql -h mysql-cc55f8d-sahlesokem6-d640.i.aivencloud.com -P 11873 -u avnadmin -p
```

### Frontend can't reach backend
```bash
# Ensure BACKEND_URL matches exactly in .env
# Check CORS configuration
# Verify backend is running: docker-compose ps
```

## 🔒 Security Checklist

- [ ] Generate strong `SESSION_SECRET`
- [ ] Set correct `BACKEND_URL` and `FRONTEND_URL`
- [ ] Enable VPS firewall (ufw)
- [ ] Configure HTTPS with Let's Encrypt
- [ ] Never commit `.env` to Git
- [ ] Keep Docker images updated
- [ ] Monitor logs regularly

## 📊 Ports

| Service | Container | Host | Protocol |
|---------|-----------|------|----------|
| Frontend | 80 | 3000 | HTTP |
| Backend | 5000 | 5000 | HTTP |

## 💡 Key Features

✅ **No database volume** - Uses external Aiven MySQL  
✅ **Auto-restart** - Services recover from crashes  
✅ **Health checks** - Automatic service monitoring  
✅ **Multi-stage build** - Optimized frontend image  
✅ **Nginx caching** - Fast static asset delivery  
✅ **React Router support** - Client-side routing works  
✅ **CORS configured** - Secure cross-origin requests  
✅ **Production ready** - Optimized for deployment  

## 📝 Deployment Checklist

- [ ] Docker & Docker Compose installed on VPS
- [ ] `.env` file configured with production values
- [ ] Aiven database accessible from VPS IP
- [ ] Ports 3000 and 5000 open on VPS firewall
- [ ] Services running: `docker-compose ps`
- [ ] Backend responding: `curl http://VPS_IP:5000/`
- [ ] Frontend responding: `curl http://VPS_IP:3000/`
- [ ] Domain configured (optional)
- [ ] HTTPS enabled (optional)
- [ ] Monitoring setup

## 🆘 Support

For detailed guides and troubleshooting:
- 📖 [Full Deployment Guide](DOCKER_DEPLOYMENT.md)
- ⚡ [Quick Reference](QUICK_REFERENCE.md)

## 🔄 Updates

To update your deployment:

```bash
# Pull latest code
git pull

# Rebuild and restart
docker-compose up -d --build

# Clean old images
docker image prune -a
```

---

**Ready to deploy? Run `./deploy.sh` on your VPS! 🚀**
