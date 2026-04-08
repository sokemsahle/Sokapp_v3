# SOKAPP Docker Deployment Guide

This guide will help you deploy SOKAPP on your VPS using Docker with your Aiven database.

## 📋 Prerequisites

- VPS with Docker and Docker Compose installed
- Aiven MySQL database (already configured)
- Domain name (optional, but recommended for production)

## 🚀 Quick Deployment Steps

### Step 1: Prepare Your VPS

```bash
# Install Docker (if not already installed)
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Add your user to docker group (optional, to run without sudo)
sudo usermod -aG docker $USER
```

### Step 2: Upload Your Project

```bash
# Option 1: Using Git (recommended)
git clone <your-repository-url>
cd "Version 3"

# Option 2: Using SCP
scp -r "Version 3" user@your-vps-ip:/path/to/deployment/
```

### Step 3: Configure Environment Variables

```bash
# Copy the example environment file
cp .env.example.docker .env

# Edit the .env file with your production values
nano .env
```

**Important: Update these values in `.env`:**

```env
# Backend URL (your VPS IP or domain with port 5000)
BACKEND_URL=http://YOUR_VPS_IP:5000

# Frontend URL (your VPS IP or domain with port 3000)
FRONTEND_URL=http://YOUR_VPS_IP:3000

# Generate a secure session secret
SESSION_SECRET=<generate-using-node-command-below>

# Brevo API Key (if using email features)
BREVO_API_KEY=your-actual-brevo-api-key
```

**Generate a secure session secret:**
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

### Step 4: Build and Start Services

```bash
# Build and start all services
docker-compose up -d --build

# View logs to ensure everything is running
docker-compose logs -f

# Check service status
docker-compose ps
```

### Step 5: Verify Deployment

```bash
# Test backend API
curl http://YOUR_VPS_IP:5000/

# Test frontend
curl http://YOUR_VPS_IP:3000/
```

Open your browser and visit:
- Frontend: `http://YOUR_VPS_IP:3000`
- Backend API: `http://YOUR_VPS_IP:5000`

## 🔧 Common Docker Commands

### View Logs
```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f backend
docker-compose logs -f frontend
```

### Restart Services
```bash
# Restart all services
docker-compose restart

# Restart specific service
docker-compose restart backend
docker-compose restart frontend
```

### Stop Services
```bash
# Stop all services
docker-compose down

# Stop and remove volumes (careful!)
docker-compose down -v
```

### Update Deployment
```bash
# Pull latest changes (if using git)
git pull

# Rebuild and restart
docker-compose up -d --build
```

### View Running Containers
```bash
docker-compose ps
```

## 🌐 Production Deployment with Domain & HTTPS

### Option 1: Using Nginx Reverse Proxy (Recommended)

1. **Install Nginx on your VPS:**
```bash
sudo apt update
sudo apt install nginx -y
```

2. **Create Nginx configuration:**
```bash
sudo nano /etc/nginx/sites-available/sokapp
```

3. **Add this configuration:**
```nginx
# Frontend
server {
    listen 80;
    server_name yourdomain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}

# Backend API
server {
    listen 80;
    server_name api.yourdomain.com;

    location / {
        proxy_pass http://localhost:5000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

4. **Enable the site:**
```bash
sudo ln -s /etc/nginx/sites-available/sokapp /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

5. **Update your `.env` file:**
```env
BACKEND_URL=https://api.yourdomain.com
FRONTEND_URL=https://yourdomain.com
```

6. **Rebuild and restart:**
```bash
docker-compose up -d --build
```

7. **Add HTTPS with Certbot:**
```bash
sudo apt install certbot python3-certbot-nginx -y
sudo certbot --nginx -d yourdomain.com -d api.yourdomain.com
```

### Option 2: Direct Port Access (Simpler)

Just use the VPS IP directly:
- Frontend: `http://YOUR_VPS_IP:3000`
- Backend: `http://YOUR_VPS_IP:5000`

Update `.env`:
```env
BACKEND_URL=http://YOUR_VPS_IP:5000
FRONTEND_URL=http://YOUR_VPS_IP:3000
```

## 🔒 Security Best Practices

1. **Firewall Configuration:**
```bash
# Allow only necessary ports
sudo ufw allow 22    # SSH
sudo ufw allow 80    # HTTP
sudo ufw allow 443   # HTTPS
sudo ufw enable
```

2. **Never commit `.env` file to Git** (already in `.gitignore`)

3. **Use strong passwords and session secrets**

4. **Enable HTTPS in production** (use Let's Encrypt - free)

5. **Regular updates:**
```bash
# Update Docker images
docker-compose pull
docker-compose up -d --build

# Clean up old images
docker image prune -a
```

## 🐛 Troubleshooting

### Backend can't connect to Aiven database
```bash
# Check if database credentials are correct
docker-compose logs backend | grep -i error

# Test database connection from VPS
mysql -h mysql-cc55f8d-sahlesokem6-d640.i.aivencloud.com -P 11873 -u avnadmin -p
```

### Frontend can't reach backend
```bash
# Check CORS settings in .env
# Ensure BACKEND_URL matches exactly what frontend uses

# Check backend is running
docker-compose ps backend

# Check backend logs
docker-compose logs backend
```

### Container won't start
```bash
# View detailed logs
docker-compose logs backend
docker-compose logs frontend

# Rebuild from scratch
docker-compose down
docker-compose build --no-cache
docker-compose up -d
```

### Port already in use
```bash
# Find what's using the port
sudo lsof -i :5000
sudo lsof -i :3000

# Kill the process or change ports in docker-compose.yml
```

## 📊 Monitoring

### Check Resource Usage
```bash
docker stats
```

### Auto-Restart on Crash
The `restart: unless-stopped` policy in docker-compose.yml ensures services restart automatically.

### Health Checks
Both services have health checks configured. View status:
```bash
docker inspect --format='{{.State.Health.Status}}' sokapp-backend
docker inspect --format='{{.State.Health.Status}}' sokapp-frontend
```

## 🔄 CI/CD Pipeline (Optional)

For automated deployments, you can set up a simple Git hook:

```bash
#!/bin/bash
# /path/to/deploy.sh
cd /path/to/Version\ 3
git pull
docker-compose up -d --build
docker image prune -f
```

## 📝 Architecture Overview

```
┌─────────────────┐
│   Frontend      │  Port 3000 (Nginx)
│   (React)       │
└────────┬────────┘
         │
         │ HTTP Requests
         ▼
┌─────────────────┐
│   Backend       │  Port 5000 (Node.js/Express)
│   (API)         │
└────────┬────────┘
         │
         │ SQL Queries
         ▼
┌─────────────────┐
│   Aiven MySQL   │  External Database
│   (Cloud)       │
└─────────────────┘
```

## 🎯 Next Steps

1. ✅ Deploy to VPS
2. ✅ Set up domain name
3. ✅ Configure HTTPS
4. ✅ Set up automated backups for Aiven
5. ✅ Monitor logs and performance
6. ✅ Set up CI/CD for automatic deployments

## 📞 Support

If you encounter issues:
1. Check logs: `docker-compose logs -f`
2. Verify `.env` configuration
3. Ensure ports 3000 and 5000 are open on your VPS
4. Test database connectivity from VPS

---

**Happy Deploying! 🚀**
