# SOKAPP VPS Deployment Guide

This guide will help you deploy SOKAPP to your VPS (Virtual Private Server) for production use.

## Table of Contents
1. [Environment Configuration](#environment-configuration)
2. [Backend Setup](#backend-setup)
3. [Frontend Setup](#frontend-setup)
4. [Database Setup](#database-setup)
5. [Running in Production](#running-in-production)
6. [Troubleshooting](#troubleshooting)

---

## Environment Configuration

### 1. Root `.env` File (Frontend)

Copy the `.env.example` file to `.env` in the root directory:

```bash
cp .env.example .env
```

**Update these variables for production:**

```env
# Database Configuration
DB_HOST=your-database-host.com          # Your MySQL server address
DB_PORT=3306                            # MySQL port (usually 3306)
DB_USER=your-db-username
DB_PASSWORD=your-db-password
DB_NAME=sokappprod                      # Production database name
DB_CONNECTION_LIMIT=10

# Server Configuration - React Frontend
PORT=3000
NODE_ENV=production

# Session Configuration
SESSION_SECRET=generate-a-strong-random-secret-key-here-min-32-chars
SESSION_TIMEOUT=3600000

# Email Configurations (Brevo)
BREVO_API_KEY=your-brevo-api-key-here
EMAIL_FROM=noreply@yourdomain.com
BREVO_SENDER_EMAIL=noreply@yourdomain.com

# API Configuration - CRITICAL FOR PRODUCTION
REACT_APP_API_URL=https://api.yourdomain.com     # Your backend API URL
# OR if on same server: http://your-server-ip:5000
# OR for testing: http://192.168.x.x:5000

# CORS & Security
ALLOWED_ORIGINS=https://yourdomain.com,https://www.yourdomain.com
MAX_REQUEST_SIZE=10mb
```

### 2. Backend `.env` File

Navigate to the Backend folder and update `.env`:

```bash
cd Backend
cp ../.env.example Backend/.env  # Or create manually
```

**Update these variables:**

```env
# Database Configuration (same as root)
DB_HOST=your-database-host.com
DB_PORT=3306
DB_USER=your-db-username
DB_PASSWORD=your-db-password
DB_NAME=sokappprod
DB_CONNECTION_LIMIT=10

# Server Configuration
PORT=5000                               # Backend runs on port 5000
NODE_ENV=production

# Session Configuration
SESSION_SECRET=generate-a-strong-random-secret-key-here-min-32-chars
SESSION_TIMEOUT=3600000

# CORS & Security
ALLOWED_ORIGINS=https://yourdomain.com,https://www.yourdomain.com
MAX_REQUEST_SIZE=10mb

# Brevo Email Configuration
BREVO_API_KEY=your-brevo-api-key-here
EMAIL_FROM=noreply@yourdomain.com
BREVO_SENDER_EMAIL=noreply@sokapp.online
```

---

## Backend Setup

### Install Dependencies

```bash
cd Backend
npm install
```

### Start Backend Server

**Development Mode:**
```bash
node server.js
```

**Production Mode (Recommended):**
Install PM2 process manager:
```bash
npm install -g pm2
pm2 start server.js --name sokapp-backend
pm2 save
pm2 startup
```

The backend will run on `http://localhost:5000` or `http://your-server-ip:5000`

---

## Frontend Setup

### Install Dependencies

From the root directory:

```bash
npm install
```

### Build for Production

```bash
npm run build
```

This creates an optimized production build in the `build/` folder.

### Serve the Build

You have several options:

#### Option 1: Using serve package (Simple)
```bash
npm install -g serve
serve -s build -l 3000
```

#### Option 2: Using PM2 (Recommended for Production)
```bash
pm2 serve build 3000 --name sokapp-frontend
pm2 save
```

#### Option 3: Using Nginx (Best Practice)

Configure Nginx to serve the static files from the `build/` folder:

```nginx
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;

    root /path/to/your/SOKAPP-project/build;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    # Proxy API requests to backend
    location /api {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

---

## Database Setup

### 1. Install MySQL (if not already installed)

```bash
# Ubuntu/Debian
sudo apt update
sudo apt install mysql-server

# CentOS/RHEL
sudo yum install mysql-server
```

### 2. Create Database and User

```sql
CREATE DATABASE sokappprod CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'sokapp_user'@'localhost' IDENTIFIED BY 'your-strong-password';
GRANT ALL PRIVILEGES ON sokappprod.* TO 'sokapp_user'@'localhost';
FLUSH PRIVILEGES;
```

### 3. Import Schema

```bash
mysql -u sokapp_user -p sokappprod < database/sokapptest_schema.sql
```

---

## Running in Production

### Quick Start Script

Create a startup script `start.sh`:

```bash
#!/bin/bash

# Start backend
cd Backend
pm2 start server.js --name sokapp-backend
cd ..

# Start frontend (if using PM2)
pm2 serve build 3000 --name sokapp-frontend

# Save PM2 configuration
pm2 save

echo "SOKAPP started successfully!"
echo "Frontend: http://your-domain.com:3000"
echo "Backend API: http://your-domain.com:5000"
```

Make it executable:
```bash
chmod +x start.sh
```

### Using Docker (Optional)

If you prefer Docker, create a `docker-compose.yml`:

```yaml
version: '3.8'

services:
  mysql:
    image: mysql:8.0
    environment:
      MYSQL_ROOT_PASSWORD: your-root-password
      MYSQL_DATABASE: sokappprod
      MYSQL_USER: sokapp_user
      MYSQL_PASSWORD: your-strong-password
    volumes:
      - mysql_data:/var/lib/mysql
      - ./database/sokapptest_schema.sql:/docker-entrypoint-initdb.d/schema.sql
    ports:
      - "3306:3306"

  backend:
    build: ./Backend
    environment:
      DB_HOST: mysql
      DB_PORT: 3306
      DB_USER: sokapp_user
      DB_PASSWORD: your-strong-password
      DB_NAME: sokappprod
      PORT: 5000
      NODE_ENV: production
    ports:
      - "5000:5000"
    depends_on:
      - mysql

  frontend:
    build: .
    command: serve -s build -l 3000
    ports:
      - "3000:3000"
    depends_on:
      - backend

volumes:
  mysql_data:
```

Run with:
```bash
docker-compose up -d
```

---

## Troubleshooting

### Frontend Can't Connect to Backend

**Problem:** Frontend shows "Failed to connect to server"

**Solution:**
1. Check that `REACT_APP_API_URL` in root `.env` points to your backend URL
2. Make sure backend is running: `pm2 list`
3. Check CORS settings in Backend `.env` - should include your frontend URL
4. Rebuild frontend after changing `.env`: `npm run build`

### Database Connection Errors

**Problem:** "Failed to connect to database"

**Solution:**
1. Verify MySQL is running: `sudo systemctl status mysql`
2. Check database credentials in both `.env` files
3. Ensure database exists: `mysql -u root -p -e "SHOW DATABASES;"`
4. Check user permissions: `mysql -u root -p -e "SHOW GRANTS FOR 'sokapp_user'@'localhost';"`

### CORS Errors

**Problem:** Browser blocks API requests with CORS error

**Solution:**
1. Update `ALLOWED_ORIGINS` in Backend `.env` to include your frontend URL
2. Format: `ALLOWED_ORIGINS=https://yourdomain.com,http://localhost:3000`
3. Restart backend: `pm2 restart sokapp-backend`

### Email Not Sending

**Problem:** Invitation/reset password emails not sent

**Solution:**
1. Verify `BREVO_API_KEY` in Backend `.env`
2. Check `EMAIL_FROM` and `BREVO_SENDER_EMAIL` are correct
3. Test Brevo API key at https://app.brevo.com/
4. Check Brevo account has available credits

---

## Production Checklist

- [ ] Update all `.env` files with production values
- [ ] Generate strong session secrets (min 32 characters)
- [ ] Set up MySQL database with proper user permissions
- [ ] Import database schema
- [ ] Install dependencies (`npm install`)
- [ ] Build frontend for production (`npm run build`)
- [ ] Configure firewall (allow ports 80, 443, 3000, 5000)
- [ ] Set up SSL certificate (Let's Encrypt recommended)
- [ ] Configure Nginx (optional but recommended)
- [ ] Set up PM2 for process management
- [ ] Enable PM2 startup on server reboot
- [ ] Test all features (login, employees, requisitions, emails)
- [ ] Set up backup strategy for database
- [ ] Configure log rotation
- [ ] Set up monitoring (optional)

---

## Security Recommendations

1. **Use HTTPS**: Always use SSL certificates in production
2. **Firewall**: Configure UFW or firewalld to allow only necessary ports
3. **Session Secret**: Use a strong random string (min 32 chars)
4. **Database**: Don't use root user, create dedicated user with limited permissions
5. **Backups**: Regular automated database backups
6. **Updates**: Keep Node.js, npm, and dependencies updated
7. **Monitoring**: Set up monitoring and alerts for downtime

---

## Support

For issues or questions:
- Check logs: `pm2 logs sokapp-backend` or `pm2 logs sokapp-frontend`
- Review this guide's troubleshooting section
- Check application logs in Backend/logs/ folder
